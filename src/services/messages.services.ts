import Message from "~/models/schemas/Message.schema"
import databaseService from "./database.services"
import { ObjectId } from "mongodb"

class MessageService {
  public async createMessage({ chat_id, sender_id, text, created_at, updated_at }: { chat_id: string, sender_id: string, text: string, created_at: Date, updated_at: Date }) {
    const result = await databaseService.messages.insertOne(
      new Message({
        chat_id: new ObjectId(chat_id),
        sender_id: new ObjectId(sender_id),
        text,
        created_at,
        updated_at
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
}
const messageService = new MessageService()
export default messageService