import { NotifyType } from "~/constants/enum"
import { ParamsDictionary, Query } from 'express-serve-static-core'

export interface NotifyReqBody {
    sender_id: string
    receiver_id: string
    type: NotifyType
    is_sent: boolean | false
    message: string
    tweet_id: string | null
    comment_id: string | null
}

export interface NotifyParams extends ParamsDictionary {
    notify_id: string
}
export interface NotifyQuery extends Pagination, Query {
    nofity_type: string
}
export interface Pagination {
    limit: string
    page: string
}
