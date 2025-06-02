import { ObjectId } from 'mongodb'
import { Media } from '../Other'
import { ParamsDictionary, Query } from 'express-serve-static-core'

export interface StoryReqBody {
    medias: Media
}

export interface StoryParams extends ParamsDictionary {
    story_id: string
}
export interface StoryQuery extends Pagination, Query {
    user_id?: string
    include_expired?: 'true' | 'false'
}
export interface Pagination {
    limit: string
    page: string
}
