import { Router } from 'express'
import { createBookmarkTweetController, unBookmarkTweetController } from '~/controllers/bookmarks.controller'
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
  wrapRequestHandler(createBookmarkTweetController)
)
/**
 * Description: remove a bookmark
 * Path: /tweet/bookmark/tweet_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token> }
 */
bookmarksRouter.delete('/tweet/:tweet_id', accessTokenValidator, verifiedUserValidator, unBookmarkTweetController)
export default bookmarksRouter
