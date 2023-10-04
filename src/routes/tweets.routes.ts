import { Router } from 'express'
import { createTweetController, getTweetController } from '~/controllers/tweets.controller'
import { createTweetValidator, tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import wrapRequestHandler from '~/utils/handlers'
export const tweetRouter = Router()
/**
 * Description: Create Tweet
 * Path: /
 * Method: POST
 * Body: TweetRequestBody
 * Header: { Authorization: Bearer <access_token> }
 */
tweetRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)
/**
 * Description: Get Tweet
 * Path: /:tweet_id
 * Method: GET
 */
tweetRouter.get('/:tweet_id', tweetIdValidator, wrapRequestHandler(getTweetController))
