import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId, WithId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enum'
import HTTP_STATUS from '~/constants/httpStatus'
import { TWEETS_MESSAGES, USERS_MESSAGES } from '~/constants/message'
import { ErrorWithStatus } from '~/models/Errors'
import { Media } from '~/models/Other'
import { TokenPayload } from '~/models/request/User.requests'
import Tweet from '~/models/schemas/Tweet.schema'
import User from '~/models/schemas/User.chema'
import databaseService from '~/services/database.services'
import wrapRequestHandler from '~/utils/handlers'
import { numberEnumToArray } from '~/utils/other'
import { validate } from '~/utils/validation'

const tweetTypes = numberEnumToArray(TweetType)
const audienceType = numberEnumToArray(TweetAudience)
const mediaType = numberEnumToArray(MediaType)
export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetTypes],
        errorMessage: TWEETS_MESSAGES.INVALID_TYPE
      }
    },
    audience: {
      isIn: {
        options: [audienceType],
        errorMessage: TWEETS_MESSAGES.INVALID_AUDIENCE
      }
    },
    // Nếu `type` là retweet, comment, quotetweet thì `parent_id` phải
    // là `tweet_id` của tweet cha, nếu `type` là tweet thì `parent_id` phải là `null`
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
          }
          if (type === TweetType.Tweet && value !== null) {
            throw new Error(TWEETS_MESSAGES.PARENT_ID_MUST_BE_NULL)
          }
          return true
        }
      }
    },
    // Nếu `type` là retweet thì `content` phải là `''`. Nếu `type` là comment, quotetweet, tweet và
    // không có `mentions` và `hashtags` thì `content` phải là string và không được rỗng.
    content: {
      isString: true,
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType
          const hashtags = req.body.hashtags as string[]
          const mentions = req.body.mentions as string[]
          if (
            [TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) &&
            isEmpty(hashtags) &&
            isEmpty(mentions) &&
            value === ''
          ) {
            throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
          }
          if (type === TweetType.Retweet && value !== '') {
            throw new Error(TWEETS_MESSAGES.CONTENT_MUST_BE_EMPTY_STRING)
          }
          return true
        }
      }
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          if (value.some((item: any) => typeof item !== 'string')) {
            throw new Error(TWEETS_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING)
          }
          return true
        }
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          if (value.some((item: any) => typeof item !== 'string')) {
            throw new Error(TWEETS_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID)
          }
          return true
        }
      }
    },
    medias: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          if (
            value.some((item: any) => {
              return typeof item.url !== 'string' || !mediaType.includes(item.type)
            })
          ) {
            throw new Error(TWEETS_MESSAGES.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
          }
          return true
        }
      }
    }
  })
)

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        // isMongoId: {
        //   errorMessage: TWEETS_MESSAGES.INVALID_TWEET_ID
        // },
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: TWEETS_MESSAGES.INVALID_TWEET_ID
              })
            }
            const [checkTweetId] = await databaseService.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
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
                }
              ])
              .toArray()
            if (!checkTweetId) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: TWEETS_MESSAGES.TWEET_NOT_FOUND
              })
            }
            req.tweet = checkTweetId as Tweet
            return true
          }
        }
      }
    },
    ['body', 'params']
  )
)

export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  // check the mode of the tweet
  if (tweet.audience === TweetAudience.TwitterCircle) {
    // check account verified
    if (!req.decoded_authorization) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
      })
    }
  }
  // check account banded?
  const author = await databaseService.users.findOne({
    _id: new ObjectId(tweet.user_id)
  })
  if (!author || author?.verify === UserVerifyStatus.Banned) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.FORBIDDEN,
      message: TWEETS_MESSAGES.TWEET_IS_NOT_PUBLIC
    })
  }
  // Check this account is in the list tweet_circle of tweet
  const { user_id } = req.decoded_authorization as TokenPayload
  const isInTweetCircle = author.twitter_circle?.some((user_circle_id) => user_circle_id.equals(user_id))
  if (!author._id.equals(user_id) && !isInTweetCircle) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.FORBIDDEN,
      message: TWEETS_MESSAGES.TWEET_IS_NOT_PUBLIC
    })
  }
  next()
})

export const getTweetChildrenValidator = validate(
  checkSchema({
    tweet_type: {
      isIn: {
        options: [tweetTypes],
        errorMessage: TWEETS_MESSAGES.INVALID_TYPE
      }
    }
  })
)

export const paginationValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true,
        custom: {
          options: async (value, { req }) => {
            const limit = Number(value)
            if (limit < 1 || limit > 100) {
              throw new Error('Limit >= 1 and limit <= 100')
            }
            return true
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: async (value, { req }) => {
            const page = Number(value)
            if (page < 1) {
              throw new Error('page >= 1')
            }
            return true
          }
        }
      }
    },
    ['query']
  )
)
