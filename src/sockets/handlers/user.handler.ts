import { Server, Socket } from 'socket.io'
import notifyService from '~/services/notifications.services'


export const registerUserHandlers = (io: Server, socket: Socket, activeUsers: Map<string, string>) => {
    const userId = socket.data.user.user_id
    activeUsers.set(userId, socket.id)

    io.emit('get_users', Array.from(activeUsers.entries()).map(([userId, socketId]) => ({ userId, socketId })))

    // Gửi thông báo khi user online
    const sendUnsentNotifications = async () => {
        const unreadNotifications = await notifyService.getUnsentNotifications(userId)
        for (const notification of unreadNotifications) {
            socket.emit('receiver_notification', notification)
            await notifyService.markAsSentNotify(notification._id)
        }

        const unreadCount = await notifyService.countUnreadNotifications(userId)
        socket.emit('notify:update', {
            unread_count: unreadCount
        })
    }

    sendUnsentNotifications()

    socket.on('disconnect', () => {
        console.log("Running disconect")
        activeUsers.delete(userId)
        io.emit('get_users', Array.from(activeUsers.entries()).map(([userId, socketId]) => ({ userId, socketId })))
    })
}