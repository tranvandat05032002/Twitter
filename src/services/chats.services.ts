import { ObjectId } from "mongodb"
import databaseService from "./database.services"
import Chat from "~/models/schemas/Chat.schema"

class ChatService {
  public async createChat(sender_id: string, receiver_id: string) {
    const result = await databaseService.chats.insertOne(
      new Chat({
        members: [new ObjectId(sender_id), new ObjectId(receiver_id)]
      })
    )
    const newChat = await databaseService.chats.findOne({
      _id: result.insertedId
    })
    return newChat
  }
  public async getUserChat(user_id: string) {
    const userId = new ObjectId(user_id)
    const chat = await databaseService.chats.find({
      members: { $in: [userId] }
    }).toArray();

    return chat
  }
  public async findChat(firstId: string, secondId: string) {
    const chat = await databaseService.chats.findOne({
      members: { $all: [new ObjectId(firstId), new ObjectId(secondId)] }
    })
    return chat
  }
}
const chatService = new ChatService()
export default chatService