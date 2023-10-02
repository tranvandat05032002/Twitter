import { ObjectId } from 'mongodb'

interface IBookmark {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date
}

export default class Bookmark {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date
  constructor(bookmark: IBookmark) {
    ;(this._id = bookmark._id || new ObjectId()),
      (this.user_id = bookmark.user_id),
      (this.tweet_id = bookmark.tweet_id),
      (this.created_at = new Date())
  }
}
