import { ObjectId } from "mongodb"
import { Server, Socket } from "socket.io"
import { NotifyType } from "~/constants/enum"
import { NotifyReqBody } from "~/models/request/Notify.request"
import Notification from "~/models/schemas/Notification.schema"
import databaseService from "~/services/database.services"
import notifyService from "~/services/notifications.services"
interface FollowNotificationData {
    sender_id: string
    receiver_id: string
}

export const handleFollowNotification = async (
    io: Server,
    activeUsers: Map<string, string>,
    data: FollowNotificationData
) => {
    const { sender_id, receiver_id } = data

    const sender = await databaseService.users.findOne({
        _id: new ObjectId(sender_id)
    })
    if (!sender) return

    const message = `${sender?.name} người dùng đã theo dõi bạn`
    const notify: NotifyReqBody = {
        sender_id: sender_id,
        receiver_id: receiver_id,
        type: NotifyType.Follow,
        message,
        is_sent: false,
        tweet_id: null,
        comment_id: null,
    }

    const result = await notifyService.createNotification(notify)
    const receiverSocketId = activeUsers.get(receiver_id)
    if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiver_notification', notify)

        await notifyService.markAsSentNotify(result.insertedId)
    }
}

export const registerNotifyHandlers = (io: Server, socket: Socket, activeUsers: Map<string, string>) => {
    socket.on('follow_user', async (data) => {
        try {
            await handleFollowNotification(io, activeUsers, data)
        } catch (error) {
            console.error('Lỗi khi gửi thông báo follow:', error)
        }
    })
}