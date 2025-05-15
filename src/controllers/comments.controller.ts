import { NextFunction, Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { COMMENT_MESSAGES } from "~/constants/message"
import { CommentQuery, CommentReqBody, CommentReqParams } from "~/models/request/Comment.request"
import { TokenPayload } from "~/models/request/User.requests"
import commentService from "~/services/comments.services"

export const createCommentController = async (req: Request<ParamsDictionary, any, CommentReqBody>,
    res: Response,
    next: NextFunction) => {
    const { content, tweet_id, parent_id } = req.body
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await commentService.createComment(content, user_id, tweet_id, parent_id)

    res.json({
        message: COMMENT_MESSAGES.CREATE_COMMENT_SUCCESS,
        result: result
    })
}
export const getCommentsController = async (
    req: Request<CommentReqParams, any, any, CommentQuery>,
    res: Response,
    next: NextFunction) => {
    const { tweet_id } = req.params
    const limit = Number(req.query.limit as string)
    const page = Number(req.query.page as string)
    const comments = await commentService.getComments({
        tweet_id,
        limit,
        page
    })

    res.json({
        message: COMMENT_MESSAGES.GET_COMMENT_SUCCESS,
        result: {
            ...comments,
            limit,
            page,
            total_page: Math.ceil(comments.total / limit)
        }
    })
}