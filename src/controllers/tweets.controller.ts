import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetType } from '~/constants/enum'
import { TWEETS_MESSAGES } from '~/constants/message'
import { Pagination, TweetParams, TweetQuery, TweetReqBody } from '~/models/request/Tweet.request'
import { TokenPayload } from '~/models/request/User.requests'
import tweetService from '~/services/tweets.services'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetService.createTweet(req.body, user_id)
  res.json({
    message: TWEETS_MESSAGES.TWEET_CREATE_SUCCESS,
    result
  })
}
export const getTweetController = async (req: Request, res: Response) => {
  const { tweet_id } = req.params
  const result = await tweetService.increaseView(tweet_id, req.decoded_authorization?.user_id as string)
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views,
    updated_at: result.updated_at
  }
  res.json({
    message: TWEETS_MESSAGES.TWEET_GET_SUCCESS,
    result: tweet
  })
}
export const getTweetChildrenController = async (req: Request<TweetParams, any, any, TweetQuery>, res: Response) => {
  const { tweet_id } = req.params
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)
  const tweet_type = Number(req.query.tweet_type as string) as TweetType
  const user_id = req.decoded_authorization?.user_id
  const { tweet, total } = await tweetService.getTweetChildren({ tweet_id, limit, page, tweet_type, user_id })
  res.json({
    message: TWEETS_MESSAGES.TWEET_CHILDREN_GET_SUCCESS,
    result: {
      tweet,
      tweet_type,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  })
}

export const getNewFeedsController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response) => {
  const user_id = req.decoded_authorization?.user_id as string
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)
  const tweet = await tweetService.getNewFeedTweet({
    user_id,
    limit,
    page
  })
  res.json({
    message: TWEETS_MESSAGES.TWEET_NEW_FEED_GET_SUCCESS,
    result: {
      tweet,
      limit,
      page,
      total_page: Math.ceil(tweet.total / limit)
    }
  })
}
