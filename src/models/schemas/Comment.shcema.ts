import { ObjectId } from 'mongodb'

interface IComment {
    _id?: ObjectId
    content: string
    tweet_id: ObjectId
    user_id: ObjectId
    parent_id: ObjectId | null

    created_by: ObjectId
    created_at?: Date
    updated_by?: ObjectId
    updated_at?: Date
    deleted_by?: ObjectId
    deleted_at?: Date

}

export default class Comment {
    _id?: ObjectId
    content: string
    tweet_id: ObjectId
    user_id: ObjectId
    parent_id: ObjectId | null

    created_by: ObjectId
    created_at?: Date
    updated_by?: ObjectId
    updated_at?: Date
    deleted_by?: ObjectId
    deleted_at?: Date
    constructor(comment: IComment) {
        const date = new Date()
            ; (this._id = comment._id || new ObjectId()),
                (this.content = comment.content),
                (this.tweet_id = comment.tweet_id),
                (this.user_id = comment.user_id),
                (this.parent_id = comment.parent_id),
                (this.created_by = comment.created_by),
                (this.created_at = date),
                (this.updated_by = undefined),
                (this.updated_at = undefined),
                (this.deleted_by = comment.deleted_by),
                (this.deleted_at = undefined)
    }
}