import { Router } from "express";
import { createCommentController, deleteCommentController, getChildrenCommentController, getCommentsController, updateCommentController } from "~/controllers/comments.controller";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import wrapRequestHandler from "~/utils/handlers";

export const commentsRouter = Router()

/**
 * Description: create comment
 * Path: /
 * Method: POST
 * Body: {content:string, tweet_id: string, parent_id: string}
 * Header: { Authorization: Bearer <access_token> }
 */
commentsRouter.post('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(createCommentController))

/**
 * Description: get comments
 * Path: /:tweet_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
commentsRouter.get('/:tweet_id', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getCommentsController))

/**
 * Description: get children comment
 * Path: /reply/:comment_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
commentsRouter.get('/reply/:comment_id', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getChildrenCommentController))

/**
 * Description: delete comment
 * Path: /:comment_id
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
commentsRouter.delete('/:comment_id', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(deleteCommentController))

/**
 * Description: update comment
 * Path: /:comment_id
 * Method: PUT
 * Header: { Authorization: Bearer <access_token> }
 */
commentsRouter.put('/:comment_id', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(updateCommentController))