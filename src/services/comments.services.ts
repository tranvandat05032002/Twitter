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
        const tweetId = new ObjectId(tweet_id)
        // const comments = await databaseService.comments.find({
        //     tweet_id: tweetId,
        // }).toArray();

        // // Lấy child comment
        // const commentMap = new Map<string, Comment>();
        // comments.forEach(comment => {
        //     (comment as any).replies = [];
        //     commentMap.set(comment._id.toString(), comment);
        // });
        // const parentComments: Comment[] = [];
        // for (const comment of comments) {
        //     if (comment.parent_id) {
        //         const parent = commentMap.get(comment.parent_id.toString())
        //         if (parent) {
        //             (parent as any).replies.push(comment)
        //         }
        //     } else {
        //         parentComments.push(comment)
        //     }
        // }

        // return parentComments
        const pipelineComment = [
            {
                $match: {
                    tweet_id: new ObjectId(tweet_id)
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
                            tweet_id: new ObjectId(tweet_id)
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
    // public async findChat(firstId: string, secondId: string) {
    //     const chat = await databaseService.chats.findOne({
    //         members: { $all: [new ObjectId(firstId), new ObjectId(secondId)] }
    //     })
    //     return chat
    // }
}
const commentService = new CommentService()
export default commentService