import { ObjectId } from "mongodb"

interface IMessage {
  _id?: ObjectId
  chatId: ObjectId
  senderId: ObjectId
  text: string
  created_at?: Date
  updated_at?: Date
}

export default class Message {
  _id?: ObjectId
  chatId: ObjectId
  senderId: ObjectId
  text: string
  created_at?: Date
  updated_at?: Date
  constructor(message: IMessage) {
    const date = new Date()
      ; (this._id = message._id || new ObjectId()),
        (this.chatId = message.chatId),
        (this.senderId = message.senderId),
        (this.text = message.text),
        (this.created_at = date),
        (this.updated_at = date)
  }
}