import { Request, Response, NextFunction } from "express"
import { ParamsDictionary } from 'express-serve-static-core'
import { MessageQuery, MessageReqBody, MessageReqParams } from "~/models/request/Message.request"
import messageService from "~/services/messages.services"
export const createMessageController = async (req: Request<ParamsDictionary, any, MessageReqBody>,
  res: Response,
  next: NextFunction) => {
  const { chat_id, sender_id, text, created_at, updated_at } = req.body
  console.log(req.body)
  const result = await messageService.createMessage({
    chat_id,
    sender_id,
    text,
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
