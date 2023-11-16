import { Router } from 'express'
import { GetConversationsController } from '~/controllers/conversations.controllers'
import { paginationValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, getConversationValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import wrapRequestHandler from '~/utils/handlers'

const conversationsRouter = Router()
/**
 * Description: Get message
 * Path: /receivers/:receiver_id
 * Method: GET
 * body: {}
 * query: {limit: string, page: string} --> convert to number
 * Header: { Authorization: Bearer <access_token> }
 */
conversationsRouter.get(
  '/receivers/:receiver_id',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  getConversationValidator,
  wrapRequestHandler(GetConversationsController)
)
export default conversationsRouter
