import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetType } from '~/constants/enum'
import { TweetParams, TweetQuery, TweetReqBody } from '~/models/request/Tweet.request'
import { TokenPayload } from '~/models/request/User.requests'
import tweetService from '~/services/tweets.services'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetService.createTweet(req.body, user_id)
  res.json({
    message: 'Create tweet successfully!',
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
    message: 'Get tweet successfully!',
    result: tweet
  })
}
export const getTweetChildren = async (req: Request<TweetParams, any, any, TweetQuery>, res: Response) => {
  const { tweet_id } = req.params
  const limit = Number(req.query.limit as string)
  const page = Number(req.query.page as string)
  const tweet_type = Number(req.query.tweet_type as string) as TweetType
  const user_id = req.decoded_authorization?.user_id
  const { tweet, total } = await tweetService.getTweetChildren({ tweet_id, limit, page, tweet_type, user_id })
  res.json({
    message: 'Get tweet children successfully!',
    result: {
      tweet,
      tweet_type,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  })
}
