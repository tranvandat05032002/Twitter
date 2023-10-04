import { Router } from 'express'
import { UnlikeTweetController, createTweetLikeController } from '~/controllers/likes.controller'
import { tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import wrapRequestHandler from '~/utils/handlers'
const likesRouter = Router()
/**
 * Description: create like tweet
 * Path: /like
 * Method: POST
 * Body: {tweet_id: string}
 * Header: { Authorization: Bearer <access_token> }
 */
likesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(createTweetLikeController)
)
/**
 * Description: unlike tweet
 * Path: /like/:like_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
likesRouter.delete('/:like_id', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(UnlikeTweetController))
// future: create router unlike by tweet_id

export default likesRouter
