import { ObjectId } from "mongodb"

interface IMessage {
  _id?: ObjectId
  chat_id: ObjectId
  sender_id: ObjectId
  text: string
  created_at?: Date
  updated_at?: Date
}

export default class Message {
  _id?: ObjectId
  chat_id: ObjectId
  sender_id: ObjectId
  text: string
  created_at?: Date
  updated_at?: Date
  constructor(message: IMessage) {
    const date = new Date()
      ; (this._id = message._id || new ObjectId()),
        (this.chat_id = message.chat_id),
        (this.sender_id = message.sender_id),
        (this.text = message.text),
        (this.created_at = message.created_at ? message.created_at : date),
        (this.updated_at = message.updated_at ? message.updated_at : date)
  }
}