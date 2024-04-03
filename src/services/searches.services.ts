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
      ;(tweet.updated_at = date), (tweet.user_views += 1)
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
    const $match: any = {
      $text: {
        $search: name
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
    const [user, total] = await Promise.all([
      databaseService.users
        .aggregate([
          {
            $match
          },
          {
            $project: {
              password: 0,
              created_at: 0,
              date_of_birth: 0,
              updated_at: 0,
              email_verify_token: 0,
              forgot_password_token: 0
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
          }
        ]).toArray(),
      databaseService.users
        .aggregate([
          {
            $match
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])
    return {
      user,
      total: total[0]?.total || 0
    }
  }
}

export const searchService = new SearchService()
