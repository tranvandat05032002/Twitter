import { NextFunction, Request, Response } from 'express'
import { CONVERSATION_MESSAGES } from '~/constants/message'
import { ConversationQuery, ConversationReqParams } from '~/models/request/Conversation.request'
import conversationService from '~/services/conversations.services'

export const GetConversationsController = async (
  req: Request<ConversationReqParams, any, any, ConversationQuery>,
  res: Response,
  next: NextFunction
) => {
  const { receiver_id } = req.params
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const sender_id = req.decoded_authorization?.user_id as string
  const result = await conversationService.getConversation({
    receiver_id,
    sender_id,
    limit,
    page
  })
  return res.json({
    message: CONVERSATION_MESSAGES.GET_CONVERSATION,
    result: {
      limit,
      page,
      total: Math.ceil(result.total / limit),
      conversation: result.conversations
    }
  })
}
