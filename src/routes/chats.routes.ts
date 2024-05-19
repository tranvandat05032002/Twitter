import { Router } from "express";
import { createChatController, findChatController, userChatsController } from "~/controllers/chats.controller";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import wrapRequestHandler from "~/utils/handlers";

export const chatsRouter = Router()

/**
 * Description: create chat
 * Path: /
 * Method: POST
 * Body: {sender_id: string, receiver_id: string}
 * Header: { Authorization: Bearer <access_token> }
 */
chatsRouter.post('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(createChatController))

/**
 * Description: get user chat
 * Path: /:userId
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
chatsRouter.get('/:userId', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(userChatsController))

/**
 * Description: find chat
 * Path: /:firstId/:secondId
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
chatsRouter.get('/find/:firstId/:secondId', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(findChatController))
