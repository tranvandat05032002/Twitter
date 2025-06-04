import { ObjectId } from "mongodb"
import { NotifyReqBody } from "~/models/request/Notify.request"
import Notification, { INotify } from "~/models/schemas/Notification.schema"
import databaseService from "./database.services"

class NotificationService {
    public async createNotification(data: NotifyReqBody) {
        const notify = new Notification({
            sender_id: new ObjectId(data.sender_id),
            receiver_id: new ObjectId(data.receiver_id),
            type: data.type,
            message: data.message,
            tweet_id: data.tweet_id ? new ObjectId(data.tweet_id) : null,
            comment_id: data.comment_id ? new ObjectId(data.comment_id) : null,
            is_read: false,
            is_sent: data.is_sent,
            created_by: new ObjectId(data.sender_id),
            created_at: new Date()
        })

        const newNotify = await databaseService.notifications.insertOne(notify)
        return newNotify
    }

    public async markAsSentNotify(notificationId: ObjectId) {
        await databaseService.notifications.updateOne(
            { _id: notificationId },
            { $set: { is_sent: true } }
        )
    }

    public async getUnsentNotifications(userId: string) {
        return await databaseService.notifications.find({
            receiver_id: new ObjectId(userId),
            is_sent: false
        }).toArray()
    }
}

const notifyService = new NotificationService()
export default notifyService