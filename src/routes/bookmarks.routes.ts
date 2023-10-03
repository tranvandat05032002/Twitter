import { Router } from 'express'
import {
  createBookmarkTweetController,
  unBookmarkByBookmarkIdController,
  unBookmarkTweetController
} from '~/controllers/bookmarks.controller'
import { tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import wrapRequestHandler from '~/utils/handlers'

const bookmarksRouter = Router()
/**
 * Description: create bookmark
 * Path: /
 * Method: POST
 * Body: {tweet_id: string}
 * Header: { Authorization: Bearer <access_token> }
 */
bookmarksRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(createBookmarkTweetController)
)
/**
 * Description: remove a bookmark from tweet_id
 * Path: /tweet/:tweet_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
bookmarksRouter.delete(
  '/tweet/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  unBookmarkTweetController
)
/**
 * Description: remove a bookmark form bookmark_id
 * Path: /:tweet_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
bookmarksRouter.delete('/:bookmark_id', accessTokenValidator, verifiedUserValidator, unBookmarkByBookmarkIdController)
export default bookmarksRouter
