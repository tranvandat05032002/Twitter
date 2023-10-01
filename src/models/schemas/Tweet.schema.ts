import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType } from '~/constants/enum'
import { Media } from '../Other'

interface ITweet {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | ObjectId
  hashtags: ObjectId[]
  mentions: string[]
  medias: Media[]
  guest_views?: number
  user_views?: number
  created_at?: Date
  updated_at?: Date
}

class Tweet {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | ObjectId
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
      (this.parent_id = tweet.parent_id ? new ObjectId(tweet.parent_id) : null),
      (this.hashtags = tweet.hashtags.map((item) => new ObjectId(item))),
      (this.mentions = tweet.mentions),
      (this.medias = tweet.medias),
      (this.guest_views = tweet.guest_views || 0),
      (this.user_views = tweet.user_views || 0),
      (this.created_at = date || new Date()),
      (this.updated_at = date || new Date())
  }
}

export default Tweet
