import { Router } from 'express'
import { createTweetLikeController } from '~/controllers/likes.controller'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
const likesRouter = Router()

likesRouter.post('/', accessTokenValidator, verifiedUserValidator, createTweetLikeController)

export default likesRouter
