import { Router } from 'express'
import {
  uploadImageAvatarController,
  uploadImageController,
  uploadImageCoverPhotoController,
  uploadImageTweetController,
  uploadVideoController,
  uploadVideoHLSController,
  uploadVoiceController,
  videoStatusController
} from '~/controllers/medias.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import wrapRequestHandler from '~/utils/handlers'
import multer from 'multer';
import path from 'path';
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

// cấu hình lưu file tạm
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/voice',            // thư mục tạm
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.webm';
      cb(null, `voice-${Date.now()}${ext}`);
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 },  // 20MB
  fileFilter: (_req, file, cb) => {
    // chấp nhận webm/opus, m4a, aac
    if (
      file.mimetype.startsWith('audio/') ||
      file.mimetype === 'audio/webm;codecs=opus'
    ) return cb(null, true);
    cb(new Error('Invalid audio type'));
  }
});

mediasRouter.post(
  '/upload-voice',
  accessTokenValidator,
  verifiedUserValidator,
  upload.single('file'),
  wrapRequestHandler(uploadVoiceController)
)

export default mediasRouter
