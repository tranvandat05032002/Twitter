import { ObjectId } from "mongodb"
import { StoryReqBody } from "~/models/request/Story.request"
import Story from "~/models/schemas/Story.schema"
import databaseService from "./database.services"

class StoryService {
    public async createStory(body: StoryReqBody, user_id: string) {
        const userId = new ObjectId(user_id)
        const expiredDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        const result = await databaseService.stories.insertOne(
            new Story({
                medias: body.medias,
                user_id: userId,
                viewers: [],
                expired_at: expiredDate,
                created_by: userId,
                updated_by: userId
            })
        )
        const story = await databaseService.stories.findOne({
            _id: result.insertedId
        })
        return story
    }

    public async getStoriesByUser({ user_id, page, limit }: { user_id: string, page: number, limit: number }) {
        const user_id_obj = new ObjectId(user_id);
        // Lấy ra danh sách người đang theo dõi và cả user hiện tại
        const followed_user_ids = await databaseService.followers
            .find(
                {
                    user_id: user_id_obj
                },
                {
                    projection: {
                        followed_user_id: 1,
                        _id: 0
                    }
                }
            )
            .toArray();
        const ids = followed_user_ids.map((item) => item.followed_user_id);
        ids.push(user_id_obj);

        // Lấy tất cả story hợp lệ và TTL còn thời hạn
        const pipelineGetStories = [
            {
                $match: {
                    user_id: {
                        $in: ids
                    },
                    deleted_at: null,
                    expired_at: { $gt: new Date() }
                }
            },
            {
                $sort: { created_at: -1 }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'viewers',  // mảng user_id
                    foreignField: '_id',
                    as: 'viewer_details'
                }
            },
            {
                $addFields: {
                    viewer_details: {
                        $map: {
                            input: '$viewer_details',
                            as: 'viewer',
                            in: {
                                _id: '$$viewer._id',
                                name: '$$viewer.name',
                                email: '$$viewer.email',
                                created_at: '$$viewer.created_at',
                                updated_at: '$$viewer.updated_at',
                                verify: '$$viewer.verify',
                                bio: '$$viewer.bio',
                                location: '$$viewer.location',
                                website: '$$viewer.website',
                                username: '$$viewer.username',
                                avatar: '$$viewer.avatar',
                                cover_photo: '$$viewer.cover_photo',
                            }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$user_id',
                    stories: {
                        $push: {
                            _id: '$_id',
                            user_id: '$user_id',
                            medias: '$medias',
                            viewers: '$viewer_details',  // Thay mảng user_id bằng mảng chi tiết user
                            expired_at: '$expired_at',
                            created_by: '$created_by',
                            created_at: '$created_at',
                            updated_by: '$updated_by',
                            updated_at: '$updated_at',
                            deleted_by: '$deleted_by',
                            deleted_at: '$deleted_at'
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    is_current_user: {
                        $cond: [{ $eq: ['$_id', user_id_obj] }, 1, 0]
                    }
                }
            },
            {
                $sort: {
                    is_current_user: -1,
                    'stories.0.created_at': -1
                }
            },
            {
                $project: {
                    'user.password': 0,
                    'user.date_of_birth': 0,
                    'user.email_verify_token': 0,
                    'user.forgot_password_token': 0,
                    'user.twitter_circle': 0
                }
            },
            {
                $skip: limit * (page - 1)
            },
            {
                $limit: limit
            }
        ]

        const pipelineCount = [
            {
                $match: {
                    user_id: {
                        $in: ids
                    },
                    deleted_at: null,
                    expired_at: { $gt: new Date() }
                }
            },
            {
                $sort: { created_at: -1 }
            },
            {
                $group: {
                    _id: '$user_id',
                    stories: { $push: '$$ROOT' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    'user.password': 0,
                    'user.date_of_birth': 0,
                    'user.email_verify_token': 0,
                    'user.forgot_password_token': 0,
                    'user.twitter_circle': 0
                }
            },
            {
                $skip: limit * (page - 1)
            },
            {
                $limit: limit
            },
            {
                $count: 'total'
            }
        ];

        const [stories, total] = await Promise.all([databaseService.stories.aggregate(pipelineGetStories).toArray(), databaseService.stories.aggregate(pipelineCount).toArray()]);

        return { stories, total: total[0]?.total || 0 };
    }

    public async deleteStory(story_id: string) {
        const now = new Date();
        const storyId = new ObjectId(story_id);

        const [story, deleteCount] = await Promise.all([
            databaseService.stories.findOne({
                _id: storyId,
                deleted_at: undefined
            }),
            databaseService.stories.updateOne(
                { _id: storyId },
                { $set: { deleted_at: now } }
            ),
        ]);

        if (!story) {
            return { deletedCount: 0 };
        }

        return {
            deletedCount: deleteCount.modifiedCount
        };
    }
    public async viewStory({ story_id, user_id }: { story_id: string, user_id: string }) {
        const storyId = new ObjectId(story_id);
        const viewerId = new ObjectId(user_id);

        const result = await databaseService.stories.updateOne(
            {
                _id: storyId,
                expired_at: { $gt: new Date() },
                viewers: { $ne: viewerId },
                user_id: { $ne: viewerId }
            },
            {
                $addToSet: { viewers: viewerId },
                $set: { updated_at: new Date() }
            }
        );

        return {
            modified: result.modifiedCount > 0
        };
    }
}

const storyService = new StoryService()
export default storyService
