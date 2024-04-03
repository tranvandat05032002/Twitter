import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TWEETS_MESSAGES, USERS_MESSAGES } from '~/constants/message'
import { SearchQuery, SearchUserQuery } from '~/models/request/Search.request'
import { searchService } from '~/services/searches.services'
export const searchController = async (
  req: Request<ParamsDictionary, any, any, SearchQuery>,
  res: Response,
  next: NextFunction
) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const user_id = req.decoded_authorization?.user_id as string
  const result = await searchService.search({
    limit,
    page,
    content: req.query.content,
    media_type: req.query.media_type,
    people_follow: req.query.people_follow,
    user_id
  })
  res.json({
    message: TWEETS_MESSAGES.TWEET_SEARCH_SUCCESS,
    result: {
      tweets: result.tweets,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}

export const searchUserController = async (
  req: Request<ParamsDictionary, any, any, SearchUserQuery>,
  res: Response,
  next: NextFunction
) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const user_id = req.decoded_authorization?.user_id as string
  const result = await searchService.searchUser({
    limit,
    page,
    name: req.query.name,
    people_follow: req.query.people_follow,
    user_id
  })
  res.json({
    message: USERS_MESSAGES.USER_SEARCH_SUCCESS,
    result: {
      data: result.user,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}