import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetReqBody } from '~/models/request/Tweet.request'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetReqBody>, res: Response) => {
  return res.json('Create Tweet success')
}
