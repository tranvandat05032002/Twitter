import { Router } from 'express'
import {
  uploadImageController,
  uploadVideoController,
  uploadVideoHLSController
} from '~/controllers/medias.controllers'
import { accessTokenValidator } from '~/middlewares/users.middlewares'
import wrapRequestHandler from '~/utils/handlers'
const mediasRouter = Router()

mediasRouter.post('/upload-image', accessTokenValidator, wrapRequestHandler(uploadImageController))
mediasRouter.post('/upload-video', accessTokenValidator, wrapRequestHandler(uploadVideoController))
mediasRouter.post('/upload-video-hls', accessTokenValidator, wrapRequestHandler(uploadVideoHLSController))

export default mediasRouter
