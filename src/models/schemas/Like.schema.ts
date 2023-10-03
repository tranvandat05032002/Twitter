import { ObjectId } from 'mongodb'

interface ILike {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date
}
export default class Like {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date

  constructor(Like: ILike) {
    ;(this._id = Like._id || new ObjectId()),
      (this.user_id = Like.user_id),
      (this.tweet_id = Like.tweet_id),
      (this.created_at = new Date())
  }
}
