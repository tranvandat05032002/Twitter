import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetReqBody } from '~/models/request/Tweet.request'
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
  res.json({
    message: 'Get tweet successfully!',
    result: req.tweet
  })
}
