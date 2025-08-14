import { ConfigurationSetAlreadyExistsException } from "@aws-sdk/client-ses"
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

interface CommentNotificationData {
    sender_id: string
    receiver_id: string
    tweet_id: string
    comment_id: string
}

interface LikeNotificationData {
    sender_id: string
    receiver_id: string
    tweet_id: string
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

    const message = "đã theo dõi bạn"
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

export const handleCommentNotification = async (
    io: Server,
    activeUsers: Map<string, string>,
    data: CommentNotificationData
) => {
    const { sender_id, receiver_id, tweet_id, comment_id } = data

    const sender = await databaseService.users.findOne({
        _id: new ObjectId(sender_id)
    })
    if (!sender) return

    const message = comment_id === undefined ? 'đã bình luận bài viết của bạn' : 'đã phản hồi bình luận của bạn'

    const notify: NotifyReqBody = {
        sender_id,
        receiver_id,
        type: NotifyType.Comment,
        message,
        is_sent: false,
        tweet_id: tweet_id,
        comment_id
    }

    const result = await notifyService.createNotification(notify)

    const receiverSocketId = activeUsers.get(receiver_id)
    if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiver_notification', notify)
        await notifyService.markAsSentNotify(result.insertedId)
    }
}

export const handleLikeNotification = async (
    io: Server,
    activeUsers: Map<string, string>,
    data: LikeNotificationData
) => {
    const { sender_id, receiver_id, tweet_id } = data

    // Không gửi thông báo cho chính mình
    if (sender_id === receiver_id) return

    const sender = await databaseService.users.findOne({
        _id: new ObjectId(sender_id)
    })
    if (!sender) return

    const message = 'đã thích bài viết của bạn'

    const notify: NotifyReqBody = {
        sender_id,
        receiver_id,
        type: NotifyType.Like,
        message,
        is_sent: false,
        tweet_id,
        comment_id: null
    }

    const result = await notifyService.createNotification(notify)

    const receiverSocketId = activeUsers.get(receiver_id)
    if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiver_notification', notify)
        await notifyService.markAsSentNotify(result.insertedId)

        // Chưa đọc thông báo
        const unreadCount = await notifyService.countUnreadNotifications(receiver_id)
        io.to(receiverSocketId).emit('notify:update', {
            unread_count: unreadCount
        })
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

    socket.on('comment_tweet', async (data) => {
        try {
            await handleCommentNotification(io, activeUsers, data)
        } catch (error) {
            console.error('Lỗi khi gửi thông báo comment:', error)
        }
    })

    socket.on('like_tweet', async (data) => {
        try {
            await handleLikeNotification(io, activeUsers, data)
        } catch (error) {
            console.error('Lỗi khi gửi thông báo like:', error)
        }
    })
}