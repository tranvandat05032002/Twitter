import { Router } from 'express'
import { searchController, searchUserController } from '~/controllers/searches.controller'
import { searchUserValidator, searchValidator } from '~/middlewares/searches.middleware'
import { paginationValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import wrapRequestHandler from '~/utils/handlers'

export const searchRouter = Router()

searchRouter.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  searchValidator,
  wrapRequestHandler(searchController)
)

searchRouter.get(
  '/people',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  searchUserValidator,
  wrapRequestHandler(searchUserController)
)