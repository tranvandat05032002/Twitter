import { ObjectId } from 'mongodb'
import { NotifyType } from '~/constants/enum'

export interface INotify {
    _id?: ObjectId
    sender_id: ObjectId
    receiver_id: ObjectId
    type: NotifyType        // 1: thích bài viết, 2: theo dõi, 3: comment, 4: phản hồi
    message: string
    tweet_id: ObjectId | null
    comment_id: ObjectId | null
    is_read: boolean
    is_sent: boolean

    created_by: ObjectId
    created_at?: Date
    updated_by?: ObjectId
    updated_at?: Date
    deleted_by?: ObjectId
    deleted_at?: Date
}
export default class Notification {
    _id: ObjectId
    sender_id: ObjectId
    receiver_id: ObjectId
    type: NotifyType
    message: string
    tweet_id: ObjectId | null
    comment_id: ObjectId | null
    is_read: boolean
    is_sent: boolean

    created_by: ObjectId
    created_at: Date
    updated_by?: ObjectId
    updated_at?: Date
    deleted_by?: ObjectId
    deleted_at?: Date

    constructor(data: INotify) {
        this._id = data._id || new ObjectId()
        this.sender_id = data.sender_id
        this.receiver_id = data.receiver_id
        this.type = data.type
        this.message = data.message
        this.tweet_id = data.tweet_id ?? null
        this.comment_id = data.comment_id ?? null
        this.is_read = data.is_read ?? false
        this.is_sent = data.is_sent ?? false

        this.created_by = data.created_by
        this.created_at = data.created_at || new Date()
        this.updated_by = data.updated_by
        this.updated_at = data.updated_at
        this.deleted_by = data.deleted_by
        this.deleted_at = data.deleted_at
    }
}
