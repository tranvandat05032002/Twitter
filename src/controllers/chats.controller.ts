import { NextFunction, Request, Response } from "express";
import { ChatQuery, ChatReqBody, ChatReqParams, FindChatReqParams } from "~/models/request/Chat.request";
import { ParamsDictionary } from "express-serve-static-core"
import chatService from "~/services/chats.services";
import { CHAT_MESSAGES } from "~/constants/message";
export const createChatController = async (req: Request<ParamsDictionary, any, ChatReqBody>,
  res: Response,
  next: NextFunction) => {
  const { sender_id, receiver_id } = req.body
  const result = await chatService.createChat(sender_id, receiver_id)
  res.json({
    message: CHAT_MESSAGES.CHAT_CREATE_SUCCESS,
    result: result
  })
}
export const userChatsController = async (
  req: Request<ChatReqParams, any, any, ChatQuery>,
  res: Response,
  next: NextFunction) => {
  const { userId } = req.params
  const result = await chatService.getUserChat(userId)
  res.json({
    message: CHAT_MESSAGES.GET_USER_CHAT_SUCCESS,
    result
  })
}
export const findChatController = async (
  req: Request<FindChatReqParams, any, any, ChatQuery>,
  res: Response,
  next: NextFunction) => {
  const { firstId, secondId } = req.params
  const result = await chatService.findChat(firstId, secondId)
  res.json({
    message: CHAT_MESSAGES.FIND_CHAT_SUCCESS,
    result
  })
}