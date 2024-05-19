import { Router } from "express";
import { createMessageController, getMessageController } from "~/controllers/messages.controller";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import wrapRequestHandler from "~/utils/handlers";

export const messagesRouter = Router()

messagesRouter.post('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(createMessageController))
messagesRouter.get('/:chatId', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getMessageController))