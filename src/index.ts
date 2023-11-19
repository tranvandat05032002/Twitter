import express from 'express'
import dotenv from 'dotenv'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultHandleError } from './middlewares/errors.middlewares'
import cors from 'cors'
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
// import '~/utils/fake'

dotenv.config()
const app = express()
const httpServer = createServer(app)

// const corsOptions = {
//   origin: 'http://localhost:3000',
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true
// }
app.use(cors())
databaseService.connect().then(() => {
  databaseService.indexUser()
  databaseService.indexRefreshToken()
  databaseService.indexFollower()
  databaseService.indexVideoStatus()
  databaseService.indexTweet()
})

initSocket(httpServer)

const PORT = process.env.PORT
const DOMAIN = process.env.DOMAIN

initFolder()
app.use(express.json())
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
