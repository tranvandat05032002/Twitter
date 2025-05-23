import { NextFunction, Request, Response } from "express"
import { ParamsDictionary } from "express-serve-static-core"
import { COMMENT_MESSAGES, COMMON_MESSAGE } from "~/constants/message"
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

export const getChildrenCommentController = async (
    req: Request<CommentReqParams, any, any, CommentQuery>,
    res: Response,
    next: NextFunction) => {
    const { comment_id } = req.params
    const comments = await commentService.getChildComment(comment_id)

    res.json({
        message: COMMENT_MESSAGES.GET_COMMENT_SUCCESS,
        result: {
            ...comments,
        }
    })
}

export const deleteCommentController = async (
    req: Request<CommentReqParams, any, any, CommentQuery>,
    res: Response,
    next: NextFunction) => {
    const { comment_id } = req.params
    const result = await commentService.deleteComment(comment_id)
    let message = COMMENT_MESSAGES.DELETE_COMMENT_SUCCESS
    if (result.deletedCount === 0) {
        return res.status(404).json({
            message: COMMON_MESSAGE.NOT_FOUND,
        });
    }

    res.json({
        message,
    })
}

export const updateCommentController = async (
    req: Request<CommentReqParams, any, CommentReqBody>,
    res: Response,
    next: NextFunction) => {
    const { comment_id } = req.params
    const { content, tweet_id } = req.body
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await commentService.updateComment(user_id, tweet_id, comment_id, content)
    let message = COMMENT_MESSAGES.UPDATE_COMMENT_SUCCESS

    if (result.modifiedCount === 0) {
        return res.status(404).json({
            message: COMMON_MESSAGE.NOT_FOUND
        })
    }

    return res.json({
        message
    })
} 