import { ParamsDictionary, Query } from "express-serve-static-core"
import { Pagination } from "./Tweet.request"
export enum MessageType {
  Text = 1, // text
  Media, // media: image, file
  Voice, // voice
  Map
}
export interface MessageReqBody {
  chat_id: string
  sender_id: string
  text: string
  type: MessageType

  // Voice
  duration?: number
  codec?: number[]
  created_at: Date
  updated_at: Date
}
export interface MessageReqParams extends ParamsDictionary {
  chatId: string
}
export interface UpdateMessageReqParams extends ParamsDictionary {
  messageId: string
  content: string
}
export interface MessageQuery extends Pagination, Query { }