import { Router } from 'express'
import {
  ServeImageController,
  ServeVideoStreamingController,
  serveM3u8Controller,
  serveSegmentController
} from '~/controllers/medias.controllers'
const staticRouter = Router()
staticRouter.get('/image/:name', ServeImageController)
staticRouter.get('/video-stream/:name', ServeVideoStreamingController)
staticRouter.get('/video-hls/:id/master.m3u8', serveM3u8Controller)
staticRouter.get('/video-hls/:id/:v/:segment', serveSegmentController)
export default staticRouter
