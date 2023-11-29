import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultHandleError } from './middlewares/errors.middlewares'
import cors, { CorsOptions } from 'cors'
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import { UPLOAD_VIDEO_DIR } from './constants/dir'
import staticRouter from './routes/statics.routes'
import { tweetRouter } from './routes/tweets.routes'
import bookmarksRouter from './routes/bookmarks.routes'
import likesRouter from './routes/likes.routes'
import { searchRouter } from './routes/searchs.routes'
import { createServer } from 'http'
import conversationsRouter from './routes/conversations.routes'
import initSocket from './utils/socket'
import { envConfig, isProduction } from './constants/config'
import helmet from 'helmet'
// import '~/utils/fake'
const file = fs.readFileSync(path.resolve('twitter-swagger.yaml'), 'utf-8')
const swaggerDocument = YAML.parse(file)
const app = express()
const httpServer = createServer(app)

const corsOptions: CorsOptions = {
  origin: isProduction ? envConfig.clientUrl : 'http://localhost:3000'
}
app.use(helmet())
app.use(cors(corsOptions))
databaseService.connect().then(() => {
  databaseService.indexUser()
  databaseService.indexRefreshToken()
  databaseService.indexFollower()
  databaseService.indexVideoStatus()
  databaseService.indexTweet()
})

initSocket(httpServer)

const PORT = envConfig.port
const DOMAIN = envConfig.domain

initFolder()
app.use(express.json())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/tweet', tweetRouter)
app.use('/search', searchRouter)
app.use('/bookmark', bookmarksRouter)
app.use('/like', likesRouter)
app.use('/conversation', conversationsRouter)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))
app.use(defaultHandleError)

httpServer.listen(PORT, () => {
  console.log(`Server running at http://${DOMAIN}:${PORT}/`)
})
