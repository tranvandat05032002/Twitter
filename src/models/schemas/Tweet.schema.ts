import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType } from '~/constants/enum'
import { Media } from '../Other'

interface ITweet {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string
  hashtags: ObjectId[]
  mentions: string[]
  medias: Media[]
  guest_views: number
  user_views: number
  created_at: Date
  updated_at: Date
}

class Tweet {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string
  hashtags: ObjectId[]
  mentions: string[]
  medias: Media[]
  guest_views: number
  user_views: number
  created_at: Date
  updated_at: Date

  constructor(tweet: ITweet) {
    const date = new Date()
    ;(this._id = tweet._id),
      (this.user_id = tweet.user_id),
      (this.type = tweet.type),
      (this.audience = tweet.audience),
      (this.content = tweet.content),
      (this.parent_id = tweet.parent_id),
      (this.hashtags = tweet.hashtags),
      (this.mentions = tweet.mentions),
      (this.medias = tweet.medias),
      (this.guest_views = tweet.guest_views),
      (this.user_views = tweet.user_views),
      (this.created_at = date || new Date()),
      (this.updated_at = date || new Date())
  }
}
