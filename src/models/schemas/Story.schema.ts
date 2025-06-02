import { ObjectId } from 'mongodb'
import { TweetType } from '~/constants/enum'
import { Media } from '../Other'

interface IStory {
    _id?: ObjectId
    user_id: ObjectId
    medias: Media
    // music?: {
    //     title: string,
    //     artlist: string,
    //     url: string,
    //     start_at: number,
    //     duration: number
    // }                    // future
    viewers: ObjectId[]
    expired_at: Date    // TTL index mongoDB

    created_by: ObjectId
    created_at?: Date
    updated_by?: ObjectId
    updated_at?: Date
    deleted_by?: ObjectId
    deleted_at?: Date

}

class Story {
    _id?: ObjectId
    user_id: ObjectId
    medias: Media
    viewers: ObjectId[]
    expired_at: Date    // TTL index mongoDB

    created_by: ObjectId
    created_at: Date
    updated_by?: ObjectId
    updated_at: Date
    deleted_by?: ObjectId
    deleted_at?: Date
    constructor(story: IStory) {
        const date = new Date()

        this._id = story._id
        this.user_id = story.user_id
        this.medias = story.medias
        this.viewers = story.viewers || []
        this.expired_at = story.expired_at

        this.created_by = story.created_by
        this.created_at = story.created_at || date

        this.updated_by = story.updated_by
        this.updated_at = story.updated_at || date

        this.deleted_by = story.deleted_by
        this.deleted_at = story.deleted_at
    }
}

export default Story