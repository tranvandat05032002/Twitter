import { Router } from 'express'
import { ServeImageController, ServeVideoController } from '~/controllers/medias.controllers'
const staticRouter = Router()
staticRouter.get('/image/:name', ServeImageController)
staticRouter.get('/video/:name', ServeVideoController)
export default staticRouter
