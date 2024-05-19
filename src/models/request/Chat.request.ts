import { ParamsDictionary, Query } from 'express-serve-static-core'
import { Pagination } from './Tweet.request'
export interface ChatReqBody {
  sender_id: string
  receiver_id: string
}
export interface ChatReqParams extends ParamsDictionary {
  user_id: string
}
export interface FindChatReqParams extends ParamsDictionary {
  firstId: string
  secondId: string
}
export interface ChatQuery extends Pagination, Query { }