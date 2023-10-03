import { NextFunction, Request, Response } from 'express'
import { TokenPayload } from '~/models/request/User.requests'
import { ParamsDictionary } from 'express-serve-static-core'
import databaseService from '~/services/database.services'
import likeService from '~/services/likes.services'
import { LikeReqBody } from '~/models/request/Like.request'
import { LIKE_MESSAGES } from '~/constants/message'

export const createTweetLikeController = async (
  req: Request<ParamsDictionary, any, LikeReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await likeService.createTweetLike(user_id, req.body.tweet_id)
  res.json({
    message: LIKE_MESSAGES.LIKE_SUCCESSFULLY,
    result
  })
}
