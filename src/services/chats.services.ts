import { ObjectId } from "mongodb"
import databaseService from "./database.services"
import Chat from "~/models/schemas/Chat.schema"

class ChatService {
  public async createChat(sender_id: string, receiver_id: string) {
    const senderObjectId = new ObjectId(sender_id);
    const receiverObjectId = new ObjectId(receiver_id);

    console.log(senderObjectId)
    console.log(receiverObjectId)

    const existingChat = await databaseService.chats.findOne({
      members: {
        $all: [senderObjectId, receiverObjectId],
        $size: 2
      }
    });

    if (existingChat) {
      return existingChat;
    }

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

    const chats = await databaseService.chats.aggregate([
      {
        $match: {
          members: { $in: [userId] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members',
          foreignField: '_id',
          as: 'member_details'
        }
      },
      {
        $project: {
          _id: 1,
          members: 1,
          created_at: 1,
          updated_at: 1,
          member_details: {
            _id: 1,
            name: 1,
            avatar: 1,
            last_online: 1
          }
        }
      }
    ]).toArray()

    return chats
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