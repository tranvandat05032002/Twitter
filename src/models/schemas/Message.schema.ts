import { ObjectId } from "mongodb"
import { MessageType } from "../request/Message.request"

interface IMessage {
  _id?: ObjectId
  chat_id: ObjectId
  sender_id: ObjectId
  text: string
  type: MessageType
  duration?: number
  codec?: number[]
  created_at?: Date
  created_by?: ObjectId
  updated_at?: Date
  upadted_by?: ObjectId
  deleted_at?: Date
  deleted_by?: ObjectId
}

export default class Message {
  _id?: ObjectId
  chat_id: ObjectId
  sender_id: ObjectId
  text: string
  type: MessageType
  duration?: number
  codec?: number[]
  created_at?: Date
  created_by: ObjectId
  updated_at?: Date
  updated_by?: ObjectId
  deleted_at?: Date
  deteled_by?: ObjectId
  constructor(message: IMessage) {
    const date = new Date()
      ; (this._id = message._id || new ObjectId()),
        (this.chat_id = message.chat_id),
        (this.sender_id = message.sender_id),
        (this.text = message.text),
        (this.type = message.type),
        (this.duration = message.duration),
        (this.codec = message.codec),
        (this.created_at = message.created_at ? message.created_at : date),
        (this.created_by = message.created_by ? message.created_by : message.sender_id),
        (this.updated_at = message.updated_at ? message.updated_at : undefined),
        (this.deleted_at = message.deleted_at ? message.deleted_at : undefined)
  }
}