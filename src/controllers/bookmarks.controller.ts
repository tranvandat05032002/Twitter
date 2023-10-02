import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKMARK_MESSAGES } from '~/constants/message'
import { BookmarkReqBody } from '~/models/request/Bookmark.request'
import { TokenPayload } from '~/models/request/User.requests'
import bookmarkService from '~/services/bookmarks.services'
export const createBookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await bookmarkService.createTweetBookmark(user_id, req.body.tweet_id)

  res.json({
    message: BOOKMARK_MESSAGES.BOOKMARK_SUCCESSFULLY,
    result
  })
}

export const unBookmarkTweetController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.params
  await bookmarkService.removeTweetBookmark(user_id, tweet_id)
  res.json({
    message: BOOKMARK_MESSAGES.UNBOOKMARK_SUCCESSFULLY
  })
}
