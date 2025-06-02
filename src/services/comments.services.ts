import { ObjectId } from "mongodb";
import { CommentWithReplies } from "~/models/request/Comment.request";
import Comment from "~/models/schemas/Comment.shcema";
import databaseService from "./database.services";

class CommentService {
    public async createComment(content: string, user_id: string, tweet_id: string, parent_id: string) {
        const result = await databaseService.comments.insertOne(
            new Comment({
                content,
                user_id: new ObjectId(user_id),
                tweet_id: new ObjectId(tweet_id),
                parent_id: parent_id !== null ? new ObjectId(parent_id) : null,
                created_by: new ObjectId(user_id)
            })
        )
        const newComment = await databaseService.comments.findOne({
            _id: result.insertedId
        })
        return newComment
    }
    public async getComments({ tweet_id, limit, page }: { tweet_id: string, limit: number; page: number }) {
        const pipelineComment = [
            {
                $match: {
                    tweet_id: new ObjectId(tweet_id),
                    deleted_at: null
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: {
                    path: "$user",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    "user.password": 0,
                    "user.date_of_birth": 0,
                    "user.email_verify_token": 0,
                    "user.forgot_password_token": 0,
                    "user.twitter_circle": 0
                }
            },
            {
                $lookup: {
                    from: "comments",
                    let: { parentId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$parent_id", "$$parentId"]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "user_id",
                                foreignField: "_id",
                                as: "user"
                            }
                        },
                        {
                            $unwind: {
                                path: "$user",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                "user.password": 0,
                                "user.date_of_birth": 0,
                                "user.email_verify_token": 0,
                                "user.forgot_password_token": 0,
                                "user.twitter_circle": 0
                            }
                        }
                    ],
                    as: "replies"
                }
            },
            {
                $match: {
                    parent_id: null
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
                    $and: [
                        {
                            tweet_id: new ObjectId(tweet_id),
                            delete_at: null
                        },
                        {
                            parent_id: null
                        }
                    ]
                }
            },
            {
                $count: 'total'
            }
        ];
        const [comments, total] = await Promise.all([databaseService.comments.aggregate(pipelineComment).toArray(), databaseService.comments.aggregate(pipelineCount).toArray()]);

        return { comments, total: total[0]?.total || 0 };
    }
    public async getChildComment(comment_id: string) {
        const parentComment = await databaseService.comments.findOne({
            _id: new ObjectId(comment_id),
            deleted_at: undefined
        });

        if (!parentComment) {
            return {
                comments: [],
                total: 0
            };
        }

        const childrenComment = await databaseService.comments.find({
            parent_id: new ObjectId(comment_id),
            delete_at: null
        }).toArray();


        return {
            comments: childrenComment,
            total: childrenComment?.length || 0
        }
    }

    public async deleteComment(comment_id: string) {
        const now = new Date();
        const commentObjectId = new ObjectId(comment_id);

        const parentComment = await databaseService.comments.findOne({
            _id: commentObjectId,
            deleted_at: undefined
        });

        if (!parentComment) {
            return { deletedCount: 0 };
        }

        const [parentResult, childrenResult] = await Promise.all([
            databaseService.comments.updateOne(
                { _id: commentObjectId },
                { $set: { deleted_at: now } }
            ),
            databaseService.comments.updateMany(
                { parent_id: commentObjectId },
                { $set: { deleted_at: now } }
            )
        ]);

        return {
            deletedCount: parentResult.modifiedCount + childrenResult.modifiedCount
        };
    }

    public async updateComment(user_id: string, tweet_id: string, comment_id: string, content: string) {
        const result = await databaseService.comments.updateOne(
            {
                _id: new ObjectId(comment_id),
                tweet_id: new ObjectId(tweet_id),
                deleted_at: undefined
            },
            {
                $set: {
                    content,
                    updated_at: new Date(),
                    updated_by: new ObjectId(user_id)
                }
            }
        )

        return result;
    }
}
const commentService = new CommentService()
export default commentService