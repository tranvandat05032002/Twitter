import { Router } from 'express'
import { ServeImageController, ServeVideoStreamingController } from '~/controllers/medias.controllers'
const staticRouter = Router()
staticRouter.get('/image/:name', ServeImageController)
staticRouter.get('/video-stream/:name', ServeVideoStreamingController)
export default staticRouter
