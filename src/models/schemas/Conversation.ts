import { ObjectId } from 'mongodb'

interface IConversation {
  _id?: ObjectId
  sender_id: ObjectId
  content: string
  receiver_id: ObjectId
  created_at?: Date
  updated_at?: Date
}

export default class Conversation {
  _id?: ObjectId
  sender_id: ObjectId
  content: string
  receiver_id: ObjectId
  created_at?: Date
  updated_at?: Date
  constructor(conversation: IConversation) {
    const date = new Date()
    ;(this._id = conversation._id || new ObjectId()),
      (this.sender_id = conversation.sender_id),
      (this.content = conversation.content),
      (this.receiver_id = conversation.receiver_id),
      (this.created_at = date),
      (this.updated_at = date)
  }
}
