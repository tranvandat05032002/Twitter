import { Router } from 'express'
import {
  uploadImageAvatarController,
  uploadImageController,
  uploadImageCoverPhotoController,
  uploadImageTweetController,
  uploadVideoController,
  uploadVideoHLSController,
  videoStatusController
} from '~/controllers/medias.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import wrapRequestHandler from '~/utils/handlers'
const mediasRouter = Router()

mediasRouter.post(
  '/upload-image',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadImageController)
)
mediasRouter.post(
  '/upload-image/avatar',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadImageAvatarController)
)
mediasRouter.post(
  '/upload-image/cover-photo',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadImageCoverPhotoController)
)
mediasRouter.post(
  '/upload-image/tweet',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadImageTweetController)
)
mediasRouter.post(
  '/upload-video',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideoController)
)
mediasRouter.post(
  '/upload-video-hls',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(uploadVideoHLSController)
)
mediasRouter.get(
  '/video-status/:id',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(videoStatusController)
)

export default mediasRouter
