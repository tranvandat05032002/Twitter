import { Router } from 'express'
import { UnlikeTweetController, createTweetLikeController } from '~/controllers/likes.controller'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
const likesRouter = Router()
/**
 * Description: create like tweet
 * Path: /like
 * Method: POST
 * Body: {tweet_id: string}
 * Header: { Authorization: Bearer <access_token> }
 */
likesRouter.post('/', accessTokenValidator, verifiedUserValidator, createTweetLikeController)
/**
 * Description: unlike tweet
 * Path: /like/:like_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
likesRouter.delete('/:like_id', accessTokenValidator, verifiedUserValidator, UnlikeTweetController)

export default likesRouter
