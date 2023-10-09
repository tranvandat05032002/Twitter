import { Router } from 'express'
import { createTweetController, getTweetChildren, getTweetController } from '~/controllers/tweets.controller'
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  tweetIdValidator
} from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
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
 * Header: { Authorization?: Bearer <access_token> }
 */
tweetRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

/**
 * Description: Get tweet children
 * Path: /:tweet_id/children
 * Method: GET
 * Header: { Authorization?: Bearer <access_token> }
 * Query: {limit: number, page: number} --> processing pagination tweet
 */
tweetRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  audienceValidator,
  getTweetChildrenValidator,
  wrapRequestHandler(getTweetChildren)
)
