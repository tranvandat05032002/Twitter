import { ObjectId } from 'mongodb'
import { Server, Socket } from 'socket.io'
import databaseService from '~/services/database.services'

interface IMessage {
    chat_id: string
    sender_id: string
    receiver_id: string
    text: string
}

const messageQueue = new Map<string, IMessage[]>()
const users = new Map<string, string>()


export const registerMessageHandlers = (io: Server, socket: Socket) => {
    const userId = socket.data.user.user_id
    users.set(userId, socket.id)

    socket.on('send_message', async (data: IMessage) => {
        const { sender_id, receiver_id, text } = data
        // const conversation = {
        //     sender_id: new ObjectId(sender_id),
        //     receiver_id: new ObjectId(receiver_id),
        //     content: text
        // }

        // await databaseService.conversations.insertOne(conversation)

        const receiverSocketId = users.get(receiver_id)
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receiver_message', data)
        } else {
            if (!messageQueue.has(receiver_id)) {
                messageQueue.set(receiver_id, [])
            }
            messageQueue.get(receiver_id)!.push(data)
        }
    })
}