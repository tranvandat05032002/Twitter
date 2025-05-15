import { ParamsDictionary, Query } from 'express-serve-static-core'
import { Pagination } from './Tweet.request'
export interface CommentReqBody {
    content: string
    tweet_id: string
    parent_id: string
}

export interface CommentReqParams extends ParamsDictionary {
    tweet_id: string
}

export interface CommentWithReplies extends Comment {
    replies: CommentWithReplies[];
}

export interface CommentQuery extends Pagination, Query {
}