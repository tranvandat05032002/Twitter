import { MediaTypeQuery, PeopleFollowType } from '~/constants/enum'
import { Pagination } from './Tweet.request'
import { Query } from 'express-serve-static-core'
export interface SearchQuery extends Pagination, Query {
  content: string
  media_type?: MediaTypeQuery
  people_follow?: PeopleFollowType
}
export interface SearchUserQuery extends Pagination, Query {
  name: string
  people_follow?: PeopleFollowType
}
