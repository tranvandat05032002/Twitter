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

    public async getListNotifications({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {

        const skip = (page - 1) * limit

        const filter = {
            receiver_id: new ObjectId(user_id),
            deleted_at: null
        }

        const notifications = await databaseService.notifications.aggregate([
            { $match: filter },
            { $sort: { created_at: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'sender_id',
                    foreignField: '_id',
                    as: 'sender'
                }
            },
            {
                $unwind: {
                    path: '$sender',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'receiver_id',
                    foreignField: '_id',
                    as: 'receiver'
                }
            },
            {
                $unwind: {
                    path: '$receiver',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    type: 1,
                    message: 1,
                    tweet_id: 1,
                    comment_id: 1,
                    created_at: 1,
                    is_sent: 1,
                    is_read: 1,
                    sender: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        avatar: 1
                    },
                    receiver: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        avatar: 1
                    }
                }
            }
        ]).toArray()

        const total = await databaseService.notifications.countDocuments(filter)

        return {
            notifications,
            total: total || 0,
        }

    }

    public async markAsSentNotify(notificationId: ObjectId) {
        await databaseService.notifications.updateOne(
            { _id: notificationId },
            { $set: { is_sent: true } }
        )
    }

    public async countUnreadNotifications(userId: string): Promise<number> {
        const count = await databaseService.notifications.countDocuments({
            receiver_id: new ObjectId(userId),
            is_read: false,
            deleted_at: null
        });
        return count;
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