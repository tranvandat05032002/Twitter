import Message from "~/models/schemas/Message.schema"
import databaseService from "./database.services"
import { ObjectId } from "mongodb"
import { MessageType } from "~/models/request/Message.request"

class MessageService {
  public async createMessage({ chat_id, sender_id, text, type, duration, codec, created_at, updated_at }: { chat_id: string, sender_id: string, text: string, type: MessageType, duration?: number, codec?: number[], created_at: Date, updated_at: Date }) {
    const result = await databaseService.messages.insertOne(
      new Message({
        chat_id: new ObjectId(chat_id),
        sender_id: new ObjectId(sender_id),
        text,
        type,
        duration,
        codec,
        created_at,
        created_by: new ObjectId(sender_id),
      })
    )
    const newMessage = await databaseService.messages.findOne({
      _id: result.insertedId
    })
    return newMessage
  }
  public async getMessage(chat_id: string) {
    const messages = await databaseService.messages.find({
      chat_id: new ObjectId(chat_id)
    }).toArray()

    return messages
  }
  public async updateMessage({ message_id, user_id, content }: { message_id: string, user_id: string, content: string }) {
    const filter = {
      _id: new ObjectId(message_id),
      sender_id: new ObjectId(user_id),
      deleted_at: undefined
    }
    const update = {
      $set: {
        updated_at: new Date(),
        text: content,
        updated_by: new ObjectId(user_id)
      }
    }
    await databaseService.messages.updateOne(filter, update)
  }
}
const messageService = new MessageService()
export default messageService