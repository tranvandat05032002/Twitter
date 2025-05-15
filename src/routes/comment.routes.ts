import { Router } from "express";
import { createCommentController, getCommentsController } from "~/controllers/comments.controller";
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
 * Path: /
 * Method: GET
 * Body: {content:string, tweet_id: string, parent_id: string}
 * Header: { Authorization: Bearer <access_token> }
 */
commentsRouter.get('/:tweet_id', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getCommentsController))