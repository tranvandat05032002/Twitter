import Message from "~/models/schemas/Message.schema"
import databaseService from "./database.services"
import { ObjectId } from "mongodb"

class MessageService {
  public async createMessage({ chat_id, sender_id, text }: { chat_id: string, sender_id: string, text: string }) {
    const result = await databaseService.messages.insertOne(
      new Message({
        chatId: new ObjectId(chat_id),
        senderId: new ObjectId(sender_id),
        text
      })
    )
    const newMessage = await databaseService.messages.findOne({
      _id: result.insertedId
    })
    return newMessage
  }
  public async getMessage(chat_id: string) {
    const messages = await databaseService.messages.find({
      chatId: new ObjectId(chat_id)
    }).toArray()

    return messages
  }
}
const messageService = new MessageService()
export default messageService