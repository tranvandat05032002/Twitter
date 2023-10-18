import { Router } from 'express'
import { searchController } from '~/controllers/searchs.controller'
import { paginationValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'

export const searchRouter = Router()

searchRouter.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  //paginationValidator,
  searchController
)
