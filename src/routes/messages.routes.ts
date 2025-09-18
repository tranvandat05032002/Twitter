import { Router } from "express";
import { createMessageController, getMessageController, updateMessageController } from "~/controllers/messages.controller";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import wrapRequestHandler from "~/utils/handlers";

export const messagesRouter = Router()

messagesRouter.post('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(createMessageController))
messagesRouter.get('/:chatId', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getMessageController))
messagesRouter.get('/:messageId', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(updateMessageController))