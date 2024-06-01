import { ParamsDictionary, Query } from "express-serve-static-core"
import { Pagination } from "./Tweet.request"
export interface MessageReqBody {
  chat_id: string
  sender_id: string
  text: string
  created_at: Date
  updated_at: Date
}
export interface MessageReqParams extends ParamsDictionary {
  chatId: string
}
export interface MessageQuery extends Pagination, Query { }