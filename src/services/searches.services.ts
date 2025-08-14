import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { MediaType, MediaTypeQuery, PeopleFollowType, TweetType } from '~/constants/enum'

class SearchService {
  async search({
    limit,
    page,
    content,
    media_type,
    people_follow,
    user_id
  }: {
    limit: number
    page: number
    content: string
    media_type?: MediaTypeQuery
    people_follow?: PeopleFollowType
    user_id: string
  }) {
    const $match: any = {
      $text: {
        $search: content
      }
    }
    if (media_type) {
      if (media_type === MediaTypeQuery.Image) {
        $match['medias.type'] = MediaType.Image
      }
      if (media_type === MediaTypeQuery.Video) {
        $match['medias.type'] = {
          $in: [MediaType.Video, MediaType.VideoHLS]
        }
      }
    }

    if (people_follow && people_follow === PeopleFollowType.Following) {
      const user_id_obj = new ObjectId(user_id)
      const followed_user_ids = await databaseService.followers
        .find(
          {
            user_id: user_id_obj
          },
          {
            projection: {
              followed_user_id: 1,
              _id: 0
            }
          }
        )
        .toArray()
      const ids = followed_user_ids.map((item) => item.followed_user_id)
      ids.push(user_id_obj)
      $match['user_id'] = {
        $in: ids
      }
    }

    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate([
          {
            $match
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.twitter_circle': {
                        $in: [new ObjectId(user_id)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $lookup: {
              from: 'hashtags',
              localField: 'hashtags',
              foreignField: '_id',
              as: 'hashtags'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'mentions',
              foreignField: '_id',
              as: 'mentions'
            }
          },
          {
            $addFields: {
              hashtags: {
                $map: {
                  input: '$hashtags',
                  as: 'tag',
                  in: {
                    _id: '$$tag._id',
                    name: '$$tag.name'
                  }
                }
              }
            }
          },
          {
            $lookup: {
              from: 'bookmarks',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'bookmarks'
            }
          },
          {
            $lookup: {
              from: 'likes',
              localField: '_id',
              foreignField: 'tweet_id',
              as: 'likes'
            }
          },
          {
            $lookup: {
              from: 'tweets',
              localField: '_id',
              foreignField: 'parent_id',
              as: 'tweet_children'
            }
          },
          {
            $addFields: {
              bookmarks: {
                $size: '$bookmarks'
              },
              likes: {
                $size: '$likes'
              },
              retweet_count: {
                $size: {
                  $filter: {
                    input: '$tweet_children',
                    as: 'tweet',
                    cond: {
                      $eq: ['$$tweet.type', TweetType.Retweet]
                    }
                  }
                }
              },
              comment_count: {
                $size: {
                  $filter: {
                    input: '$tweet_children',
                    as: 'tweet',
                    cond: {
                      $eq: ['$$tweet.type', TweetType.Comment]
                    }
                  }
                }
              },
              quote_count: {
                $size: {
                  $filter: {
                    input: '$tweet_children',
                    as: 'tweet',
                    cond: {
                      $eq: ['$$tweet.type', TweetType.QuoteTweet]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              tweet_children: 0,
              user: {
                password: 0,
                date_of_birth: 0,
                email_verify_token: 0,
                forgot_password_token: 0,
                twitter_circle: 0
              }
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          }
        ])
        .toArray(),
      databaseService.tweets
        .aggregate([
          {
            $match
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.twitter_circle': {
                        $in: [new ObjectId(user_id)]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])
    const tweet_ids = tweets.map((tweet) => tweet._id as ObjectId)
    const date = new Date()
    await databaseService.tweets.updateMany(
      {
        _id: {
          $in: tweet_ids
        }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: date
        }
      }
    )
    tweets.map((tweet) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      ; (tweet.updated_at = date), (tweet.user_views += 1)
    })
    return {
      tweets,
      total: total[0]?.total || 0
    }
  }
  async searchUser({
    limit,
    page,
    name,
    people_follow,
    user_id
  }: {
    limit: number
    page: number
    name: string
    people_follow?: PeopleFollowType
    user_id: string
  }) {
    const user_id_obj = new ObjectId(user_id)

    const $match: any = {
      _id: { $ne: user_id_obj }
    }

    if (name) {
      $match.$text = { $search: name }
    }

    // Pipeline dùng chung cho cả truy vấn user và đếm
    const basePipeline: any[] = [
      { $match },
      {
        $lookup: {
          from: "followers",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", user_id_obj] },
                    { $eq: ["$followed_user_id", "$$userId"] }
                  ]
                }
              }
            }
          ],
          as: "following_status"
        }
      },
      {
        $addFields: {
          is_following: { $gt: [{ $size: "$following_status" }, 0] }
        }
      },
      {
        $project: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          following_status: 0
        }
      }
    ]

    // Thêm sort và phân trang vào bản truy vấn dữ liệu
    const userPipeline = [
      ...basePipeline,
      { $sort: { name: 1 } },
      { $skip: limit * (page - 1) },
      { $limit: limit }
    ]

    // Pipeline để count tổng số
    const countPipeline = [...basePipeline, { $count: "total" }]

    const [users, totalResult] = await Promise.all([
      databaseService.users.aggregate(userPipeline).toArray(),
      databaseService.users.aggregate(countPipeline).toArray()
    ])

    const total = totalResult[0]?.total || 0

    return {
      users,
      total
    }
  }
}

export const searchService = new SearchService()
