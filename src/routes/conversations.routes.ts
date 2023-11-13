import { Router } from 'express'
import { GetConversationsController } from '~/controllers/conversations.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'

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
  GetConversationsController
)
export default conversationsRouter
