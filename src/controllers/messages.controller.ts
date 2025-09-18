import { Request, Response, NextFunction } from "express"
import { ParamsDictionary } from 'express-serve-static-core'
import { MessageQuery, MessageReqBody, MessageReqParams, UpdateMessageReqParams } from "~/models/request/Message.request"
import { TokenPayload } from "~/models/request/User.requests"
import messageService from "~/services/messages.services"
export const createMessageController = async (req: Request<ParamsDictionary, any, MessageReqBody>,
  res: Response,
  next: NextFunction) => {
  const { chat_id, sender_id, text, created_at, updated_at, type, duration, codec } = req.body
  const result = await messageService.createMessage({
    chat_id,
    sender_id,
    text,
    type,
    duration,
    codec,
    created_at,
    updated_at
  })
  res.json({
    message: "Create message successfully !",
    result
  })
}
export const getMessageController = async (req: Request<MessageReqParams, any, MessageQuery>,
  res: Response,
  next: NextFunction) => {
  const { chatId } = req.params
  const result = await messageService.getMessage(chatId)
  res.json({
    message: "Get message successfully !",
    result
  })
}

export const updateMessageController = async (req: Request<UpdateMessageReqParams, any, MessageQuery>,
  res: Response,
  next: NextFunction) => {
  const { messageId, content } = req.params
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const result = await messageService.updateMessage({
    message_id: messageId,
    user_id,
    content
  })
  res.json({
    message: "Update message successfully !",
    result
  })
}
