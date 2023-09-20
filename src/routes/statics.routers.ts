import { Router } from 'express'
import { ServeImageController } from '~/controllers/medias.controllers'
const staticRouter = Router()
staticRouter.get('/image/:name', ServeImageController)
export default staticRouter
