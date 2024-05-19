import { ObjectId } from "mongodb"

interface IChat {
  _id?: ObjectId
  members: ObjectId[]
  created_at?: Date
  updated_at?: Date
}

export default class Chat {
  _id?: ObjectId
  members: ObjectId[]
  created_at?: Date
  updated_at?: Date
  constructor(chat: IChat) {
    const date = new Date()
      ; (this._id = chat._id || new ObjectId()),
        (this.members = chat.members),
        (this.created_at = date),
        (this.updated_at = date)
  }
}