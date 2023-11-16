import { ParamsDictionary, Query } from 'express-serve-static-core'
import { Pagination } from './Tweet.request'

export interface ConversationReqParams extends ParamsDictionary {
  receiver_id: string
}

export interface ConversationQuery extends Pagination, Query {}
