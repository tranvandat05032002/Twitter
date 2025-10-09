import { TweetReqBody } from '~/models/request/Tweet.request'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { TweetType } from '~/constants/enum'
import { esSearchMyTweetsPaged } from '~/es/search/tweet.search'
import { bulkDeleteTweetsByIds, bulkIndexTweets, mapMongoTweetToES } from '~/es/write/tweet.write'

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
              from: 'bookmarks',
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
              as: 'bookmarked_docs'
            }
          },
          {
            $addFields: {
              bookmarked: { $gt: [{ $size: '$bookmarked_docs' }, 0] }
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
            $lookup: {
              from: 'comments',
              let: { tweetId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$tweet_id', '$$tweetId'] },
                        { $eq: ['$deleted_at', null] }
                      ]
                    }
                  }
                }
              ],
              as: 'comments'
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
              comments: {
                $size: '$comments'
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
              bookmarked_docs: 0,
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

  /** Hydrate theo danh sách id và GIỮ THỨ TỰ như ES trả về */
  private async hydrateTweetsByIdsInOrder(idsObj: ObjectId[], user_id_obj: ObjectId) {
    const tweets = await databaseService.tweets
      .aggregate([
        { $match: { _id: { $in: idsObj } } },
        { $addFields: { order: { $indexOfArray: [idsObj, '$_id'] } } },
        { $sort: { order: 1 } },

        { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user' } },
        {
          $match: {
            $or: [
              { audience: 0 },
              { $and: [{ audience: 1 }, { 'user.twitter_circle': { $in: [user_id_obj] } }] }
            ]
          }
        },

        { $lookup: { from: 'hashtags', localField: 'hashtags', foreignField: '_id', as: 'hashtags' } },
        { $lookup: { from: 'users', localField: 'mentions', foreignField: '_id', as: 'mentions' } },
        {
          $addFields: {
            hashtags: {
              $map: { input: '$hashtags', as: 'tag', in: { _id: '$$tag._id', name: '$$tag.name' } }
            }
          }
        },
        { $lookup: { from: 'bookmarks', localField: '_id', foreignField: 'tweet_id', as: 'bookmarks' } },
        {
          $lookup: {
            from: 'bookmarks',
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
            as: 'bookmarked_docs'
          }
        },
        { $addFields: { bookmarked: { $gt: [{ $size: '$bookmarked_docs' }, 0] } } },
        { $lookup: { from: 'likes', localField: '_id', foreignField: 'tweet_id', as: 'likes' } },
        { $lookup: { from: 'tweets', localField: '_id', foreignField: 'parent_id', as: 'tweet_children' } },
        {
          $lookup: {
            from: 'comments',
            let: { tweetId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$tweet_id', '$$tweetId'] },
                      { $eq: ['$deleted_at', null] }
                    ]
                  }
                }
              }
            ],
            as: 'comments'
          }
        },
        {
          $addFields: {
            bookmarks: { $size: '$bookmarks' },
            likes: { $size: '$likes' },
            comments: { $size: '$comments' },
            views: { $add: ['$guest_views', '$user_views'] },
            retweet_count: {
              $size: {
                $filter: { input: '$tweet_children', as: 'tweet', cond: { $eq: ['$$tweet.type', TweetType.Retweet] } }
              }
            },
            comment_count: {
              $size: {
                $filter: { input: '$tweet_children', as: 'tweet', cond: { $eq: ['$$tweet.type', TweetType.Comment] } }
              }
            },
            quote_count: {
              $size: {
                $filter: { input: '$tweet_children', as: 'tweet', cond: { $eq: ['$$tweet.type', TweetType.QuoteTweet] } }
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
        { $addFields: { liked: { $gt: [{ $size: '$liked_docs' }, 0] } } },
        {
          $project: {
            order: 0,
            tweet_children: 0,
            liked_docs: 0,
            user: {
              password: 0, date_of_birth: 0, email_verify_token: 0,
              forgot_password_token: 0, twitter_circle: 0
            }
          }
        }
      ])
      .toArray();

    return tweets;
  }

  public async getMyTweet({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const user_id_obj = new ObjectId(user_id);
    console.log("Running")
    // 1) Thử lấy khung trang từ ES
    let esIds: string[] = [];
    let esTotal = 0;
    let esVersions = new Map<string, string | undefined>();
    let esFailed = false;

    try {
      console.log("Running 2")
      const es = await esSearchMyTweetsPaged(user_id, page, limit);
      console.log("ES ----> ", es)
      esIds = es.ids;
      esTotal = es.total;
      esVersions = es.versions;
    } catch (e) {
      esFailed = true;
    }

    // ES có id → hydrate theo đúng thứ tự
    if (!esFailed && esIds.length > 0) {
      const idsObj = esIds.map((s) => new ObjectId(s));
      const tweets = await this.hydrateTweetsByIdsInOrder(idsObj, user_id_obj);

      // 2) Reconcile: nếu DB và ES khác nhau → write-behind đồng bộ ES
      // a) Thiếu trên ES: (tweet từ DB nhưng không có trong esIds) — thường không xảy ra vì match theo ids
      const dbIds = tweets.map((t: any) => String(t._id));
      const missingOnES = dbIds.filter(id => !esIds.includes(id));

      // b) Stale trên ES: updated_at khác
      const staleOnES: string[] = [];
      for (const t of tweets) {
        const id = String(t._id);
        const esU = esVersions.get(id);
        const dbU = new Date(t.updated_at).toISOString();
        if (!esU || esU !== dbU) staleOnES.push(id);
      }

      // c) (Tuỳ chọn) Dư trên ES: ES có id nhưng DB không trả (có thể do xoá) → xoá ES
      const missingOnDB = esIds.filter(id => !dbIds.includes(id));

      // 3) Write-behind: upsert các doc stale/thiếu; delete doc dư
      if (missingOnES.length || staleOnES.length) {
        const needUpsertSet = new Set([...missingOnES, ...staleOnES]);
        const needUpsertDocs = tweets.filter((t: any) => needUpsertSet.has(String(t._id))).map(mapMongoTweetToES);
        void bulkIndexTweets(needUpsertDocs).catch(console.error);
      }
      if (missingOnDB.length) {
        void bulkDeleteTweetsByIds(missingOnDB).catch(console.error);
      }

      return { tweets, total: esTotal };
    }


    // Trường hợp miss ở ES thì truy vấn ở DB và sau đó sync lại dữ liệu vào ES
    const [tweets, total] = await Promise.all([
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
              from: 'bookmarks',
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
              as: 'bookmarked_docs'
            }
          },
          {
            $addFields: {
              bookmarked: { $gt: [{ $size: '$bookmarked_docs' }, 0] }
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
            $lookup: {
              from: 'comments',
              let: { tweetId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$tweet_id', '$$tweetId'] },
                        { $eq: ['$deleted_at', null] }
                      ]
                    }
                  }
                }
              ],
              as: 'comments'
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
              comments: {
                $size: '$comments'
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

    void bulkIndexTweets(tweets.map(mapMongoTweetToES)).catch(console.error);
    return { tweets, total: total[0]?.total || 0 };
  }

  public async getTweetsFromOtherUsers({ current_user_id, user_id, limit, page }: { current_user_id: string; user_id: string, limit: number; page: number }) {
    const currentUserObjectId = new ObjectId(current_user_id);
    const userIdObjectId = new ObjectId(user_id);

    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate([
          {
            $match: {
              user_id: userIdObjectId
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
              audience: { $in: [0, 1] }
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
              from: 'bookmarks',
              let: { tweetId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$tweet_id', '$$tweetId'] },
                        { $eq: ['$user_id', currentUserObjectId] }
                      ]
                    }
                  }
                }
              ],
              as: 'bookmarked_docs'
            }
          },
          {
            $addFields: {
              bookmarked: { $gt: [{ $size: '$bookmarked_docs' }, 0] }
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
            $lookup: {
              from: 'comments',
              let: { tweetId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$tweet_id', '$$tweetId'] },
                        { $eq: ['$deleted_at', null] }
                      ]
                    }
                  }
                }
              ],
              as: 'comments'
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
              comments: {
                $size: '$comments'
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
                        { $eq: ['$user_id', currentUserObjectId] }
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
              bookmarked_docs: 0,
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
              user_id: currentUserObjectId
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
          { $unwind: '$user' },
          {
            $match: {
              audience: { $in: [0, 1] }
            }
          },
          { $count: 'total' }
        ])
        .toArray()
    ])

    return {
      tweets,
      total: total[0]?.total || 0
    };
  }

  public async getTweetLike({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const user_id_obj = new ObjectId(user_id);

    const pipeline = [
      {
        $match: {
          user_id: user_id_obj
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
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          tweet_children: 0,
          'user.password': 0,
          'user.date_of_birth': 0,
          'user.email_verify_token': 0,
          'user.forgot_password_token': 0,
          'user.twitter_circle': 0
        }
      },
      {
        $lookup: {
          from: 'tweets',
          localField: 'tweet_id',
          foreignField: '_id',
          as: 'tweet'
        }
      },
      {
        $unwind: {
          path: '$tweet',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'hashtags',
          localField: 'tweet.hashtags',
          foreignField: '_id',
          as: 'tweet.hashtags'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'tweet.mentions',
          foreignField: '_id',
          as: 'tweet.mentions'
        }
      },
      {
        $lookup: {
          from: 'bookmarks',
          localField: 'tweet._id',
          foreignField: 'tweet_id',
          as: 'tweet.bookmarks'
        }
      },
      {
        $lookup: {
          from: 'likes',
          localField: 'tweet._id',
          foreignField: 'tweet_id',
          as: 'tweet.likes'
        }
      },
      {
        $lookup: {
          from: 'tweets',
          localField: 'tweet._id',
          foreignField: 'parent_id',
          as: 'tweet_children'
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: 'tweet._id',
          foreignField: 'tweet_id',
          as: 'tweet.comments'
        }
      },
      {
        $addFields: {
          'tweet.bookmarks': { $size: '$tweet.bookmarks' },
          'tweet.likes': { $size: '$tweet.likes' },
          'tweet.comments': { $size: '$tweet.comments' },
          'tweet.views': {
            $add: ['$tweet.guest_views', '$tweet.user_views']
          },
          'tweet.retweet_count': {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'tweet',
                cond: { $eq: ['$$tweet.type', 1] }
              }
            }
          },
          'tweet.comment_count': {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'tweet',
                cond: { $eq: ['$$tweet.type', 2] }
              }
            }
          },
          'tweet.quote_count': {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'tweet',
                cond: { $eq: ['$$tweet.type', 3] }
              }
            }
          }
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$$ROOT', '$tweet']
          }
        }
      },
      {
        $project: {
          tweet: 0,
          tweet_children: 0
        }
      },
      {
        $project: {
          tweet_children: 0
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
          liked_doc: { $arrayElemAt: ['$liked_docs', 0] },
          like_id: {
            $cond: [
              { $ifNull: [{ $arrayElemAt: ['$liked_docs._id', 0] }, false] },
              { $toString: { $arrayElemAt: ['$liked_docs._id', 0] } },
              null
            ]
          },
          liked: { $gt: [{ $size: '$liked_docs' }, 0] }
        }
      },
      {
        $project: {
          liked_doc: 0,
          liked_docs: 0
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
      }
    ];

    const [tweets, total] = await Promise.all([
      databaseService.likes
        .aggregate(pipeline)
        .toArray(),
      databaseService.tweets
        .aggregate([
          {
            $match: {
              user_id: user_id_obj
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
              path: '$user',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              tweet_children: 0,
              'user.password': 0,
              'user.date_of_birth': 0,
              'user.email_verify_token': 0,
              'user.forgot_password_token': 0,
              'user.twitter_circle': 0
            }
          },
          {
            $lookup: {
              from: 'tweets',
              localField: 'tweet_id',
              foreignField: '_id',
              as: 'tweet'
            }
          },
          {
            $unwind: {
              path: '$tweet',
              preserveNullAndEmptyArrays: true
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

  public async getTweetBookmark({
    user_id,
    limit,
    page
  }: {
    user_id: string
    limit: number
    page: number
  }) {
    const user_id_obj = new ObjectId(user_id)

    const pipeline = [
      {
        $match: {
          user_id: user_id_obj
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
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          tweet_children: 0,
          'user.password': 0,
          'user.date_of_birth': 0,
          'user.email_verify_token': 0,
          'user.forgot_password_token': 0,
          'user.twitter_circle': 0
        }
      },
      {
        $lookup: {
          from: 'tweets',
          localField: 'tweet_id',
          foreignField: '_id',
          as: 'tweet'
        }
      },
      {
        $unwind: {
          path: '$tweet',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'hashtags',
          localField: 'tweet.hashtags',
          foreignField: '_id',
          as: 'tweet.hashtags'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'tweet.mentions',
          foreignField: '_id',
          as: 'tweet.mentions'
        }
      },
      {
        $lookup: {
          from: 'bookmarks',
          localField: 'tweet._id',
          foreignField: 'tweet_id',
          as: 'tweet.bookmarks'
        }
      },
      {
        $lookup: {
          from: 'likes',
          localField: 'tweet._id',
          foreignField: 'tweet_id',
          as: 'tweet.likes'
        }
      },
      {
        $lookup: {
          from: 'tweets',
          localField: 'tweet._id',
          foreignField: 'parent_id',
          as: 'tweet_children'
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: 'tweet._id',
          foreignField: 'tweet_id',
          as: 'tweet.comments'
        }
      },
      {
        $addFields: {
          'tweet.bookmarks': { $size: '$tweet.bookmarks' },
          'tweet.likes': { $size: '$tweet.likes' },
          'tweet.comments': { $size: '$tweet.comments' },
          'tweet.views': {
            $add: ['$tweet.guest_views', '$tweet.user_views']
          },
          'tweet.retweet_count': {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'tweet',
                cond: { $eq: ['$$tweet.type', 1] }
              }
            }
          },
          'tweet.comment_count': {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'tweet',
                cond: { $eq: ['$$tweet.type', 2] }
              }
            }
          },
          'tweet.quote_count': {
            $size: {
              $filter: {
                input: '$tweet_children',
                as: 'tweet',
                cond: { $eq: ['$$tweet.type', 3] }
              }
            }
          }
        }
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$$ROOT', '$tweet']
          }
        }
      },
      {
        $project: {
          tweet: 0,
          tweet_children: 0
        }
      },
      {
        $lookup: {
          from: 'bookmarks',
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
          as: 'bookmark_docs'
        }
      },
      {
        $addFields: {
          bookmark_doc: { $arrayElemAt: ['$bookmark_docs', 0] },
          bookmark_id: {
            $cond: [
              { $ifNull: [{ $arrayElemAt: ['$bookmark_docs._id', 0] }, false] },
              { $toString: { $arrayElemAt: ['$bookmark_docs._id', 0] } },
              null
            ]
          },
          bookmarked: { $gt: [{ $size: '$bookmark_docs' }, 0] }
        }
      },
      {
        $project: {
          bookmark_doc: 0,
          bookmark_docs: 0
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
      }
    ]

    const [tweets, total] = await Promise.all([
      databaseService.bookmarks.aggregate(pipeline).toArray(),
      databaseService.bookmarks
        .aggregate([
          {
            $match: {
              user_id: user_id_obj
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])

    return { tweets, total: total[0]?.total || 0 }
  }

  public async deleteTweet(tweet_id: string) {
    const now = new Date();
    const tweetId = new ObjectId(tweet_id);

    const tweet = await databaseService.tweets.findOne({
      _id: tweetId,
    });

    if (!tweet) {
      return { deletedCount: 0 };
    }

    const [deleteTweetResult, deleteLikesResult, deleteCommentsResult] = await Promise.all([
      databaseService.tweets.deleteOne({ _id: tweetId }),
      databaseService.likes.deleteMany({ tweet_id: tweetId }),
      databaseService.comments.deleteMany({ tweet_id: tweetId }),
    ]);

    return {
      deletedCount: deleteTweetResult.deletedCount,
      deletedLikes: deleteLikesResult.deletedCount,
      deletedComments: deleteCommentsResult.deletedCount,
    };
  }

}
const tweetService = new TweetService()
export default tweetService


