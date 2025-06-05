import { Router } from "express";
import { getListNotificationsController } from "~/controllers/notifications.controller";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import wrapRequestHandler from "~/utils/handlers";

export const notificationsRouter = Router()

notificationsRouter.get('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getListNotificationsController))