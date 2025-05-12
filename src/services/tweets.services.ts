import { TweetReqBody } from '~/models/request/Tweet.request'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { TweetType } from '~/constants/enum'

class TweetService {
  public async checkAndCreateHashtags(hashtags: string[]) {
    const hashtagDocument = await Promise.all(
      hashtags.map((hashtag) => {
        return databaseService.hashtags.findOneAndUpdate(
          {
            name: hashtag
          },
          {
            $setOnInsert: new Hashtag({ name: hashtag })
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        )
      })
    )

    return hashtagDocument.map((hashtag) => (hashtag.value as WithId<Hashtag>)._id)
  }
  public async createTweet(body: TweetReqBody, user_id: string) {
    const hashtags = await this.checkAndCreateHashtags(body.hashtags)
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        type: body.type,
        content: body.content,
        audience: body.audience,
        hashtags,
        medias: body.medias,
        parent_id: body.parent_id,
        user_id: new ObjectId(user_id),
        mentions: body.mentions
      })
    )
    const tweet = await databaseService.tweets.findOne({
      _id: result.insertedId
    })
    return tweet
  }
  public async increaseView(tweet_id: string, user_id?: string) {
    const tweetObjectId = new ObjectId(tweet_id)

    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }

    // Cập nhật lượt xem và updated_at
    const updateResult = await databaseService.tweets.findOneAndUpdate(
      { _id: tweetObjectId },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          guest_views: 1,
          user_views: 1,
          updated_at: 1
        }
      }
    )

    if (!updateResult.value) return null

    // Kiểm tra nếu có user_id thì truy vấn xem user đó đã like chưa
    let liked = false

    if (user_id) {
      const likeDoc = await databaseService.likes.findOne({
        tweet_id: tweetObjectId,
        user_id: new ObjectId(user_id)
      })
      liked = !!likeDoc
    }

    return {
      ...updateResult.value,
      liked
    }
  }
  public async getTweetChildren({
    tweet_id,
    limit,
    page,
    tweet_type,
    user_id
  }: {
    tweet_id: string
    limit: number
    page: number
    tweet_type: TweetType
    user_id?: string
  }) {
    const tweet = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type
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
            tweet_children: 0
          }
        },
        {
          $skip: limit * (page - 1)
        },
        {
          $limit: limit
        }
      ])
      .toArray()
    const ids = tweet.map((tweet) => tweet._id as ObjectId)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const date = new Date()

    const [total] = await Promise.all([
      databaseService.tweets.countDocuments({
        parent_id: new ObjectId(tweet_id),
        type: tweet_type
      }),
      databaseService.tweets.updateMany(
        {
          _id: {
            $in: ids
          }
        },
        {
          $inc: inc,
          $set: {
            updated_at: date
          }
        }
      )
    ])
    //This code update view on client
    tweet.forEach((tweet) => {
      tweet.updated_at = date
      if (tweet.user_id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })
    return {
      tweet,
      total
    }
  }
  public async getNewFeedTweet({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const user_id_obj = new ObjectId(user_id);
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
      .toArray();
    const ids = followed_user_ids.map((item) => item.followed_user_id);
    ids.push(user_id_obj);

    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate([
          {
            $match: {
              user_id: {
                $in: ids
              }
            }
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
                        $in: [user_id_obj]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $sort: {
              created_at: -1
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
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
              views: {
                $add: ['$guest_views', '$user_views']
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
            $lookup: {
              from: 'likes',
              let: { tweetId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$tweet_id', '$$tweetId'] },
                        { $eq: ['$user_id', user_id_obj] }
                      ]
                    }
                  }
                }
              ],
              as: 'liked_docs'
            }
          },
          {
            $addFields: {
              liked: { $gt: [{ $size: '$liked_docs' }, 0] }
            }
          },
          {
            $project: {
              tweet_children: 0,
              liked_docs: 0,
              user: {
                password: 0,
                date_of_birth: 0,
                email_verify_token: 0,
                forgot_password_token: 0,
                twitter_circle: 0
              }
            }
          }
        ])
        .toArray(),
      databaseService.tweets
        .aggregate([
          {
            $match: {
              user_id: {
                $in: ids
              }
            }
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
                        $in: [user_id_obj]
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
    ]);

    const tweet_ids = tweets.map((tweet) => tweet._id as ObjectId);
    const date = new Date();
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
    );
    tweets.forEach((tweet) => {
      tweet.updated_at = date;
      tweet.user_views += 1;
    });

    return { tweets, total: total[0]?.total || 0 };
  }

  public async getMyTweet({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const user_id_obj = new ObjectId(user_id);
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
      .toArray();
    const ids = followed_user_ids.map((item) => item.followed_user_id);
    ids.push(user_id_obj);

    const pipeline = [
      {
        $match: {
          user_id: new ObjectId(user_id)
        }
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
        $unwind: '$user'
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
        $addFields: {
          likes: { $size: '$likes' }
        }
      },
      {
        $lookup: {
          from: 'likes',
          let: { tweetId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$tweet_id', '$$tweetId'] },
                    { $eq: ['$user_id', user_id_obj] }
                  ]
                }
              }
            }
          ],
          as: 'liked_docs'
        }
      },
      {
        $addFields: {
          liked: { $gt: [{ $size: '$liked_docs' }, 0] }
        }
      },
      {
        $project: {
          tweet_children: 0,
          liked_docs: 0,
          user: {
            password: 0,
            date_of_birth: 0,
            email_verify_token: 0,
            forgot_password_token: 0,
            twitter_circle: 0
          }
        }
      },
      { $skip: limit * (page - 1) },
      { $limit: limit }
    ]

    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate(pipeline)
        .toArray(),
      databaseService.tweets
        .aggregate([
          {
            $match: {
              user_id: new ObjectId(user_id)
            }
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
            $count: 'total'
          }
        ])
        .toArray()
    ]);

    return { tweets, total: total[0]?.total || 0 };
  }
}
const tweetService = new TweetService()
export default tweetService


