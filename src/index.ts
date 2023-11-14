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
import { Server } from 'socket.io'
import Conversation from './models/schemas/Conversation'
import { ObjectId } from 'mongodb'
import conversationsRouter from './routes/conversations.routes'
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

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL
  }
})
interface IConversation {
  payload: {
    sender_id: string
    receiver_id: string
    content: string
  }
}
const users: {
  [key: string]: { socket_id: string }
} = {}
io.on('connection', (socket) => {
  console.log(`User ${socket.id} connected`)
  const user_id = socket.handshake.auth._id
  if (!user_id) return
  users[user_id] = {
    socket_id: socket.id
  }
  console.log(users)
  socket.on('send_message', async (data: IConversation) => {
    const { receiver_id, content, sender_id } = data.payload
    const receiver_socket_id = users[receiver_id]?.socket_id
    if (!receiver_socket_id) {
      return
    }
    const conversation = new Conversation({
      sender_id: new ObjectId(sender_id),
      content: content,
      receiver_id: new ObjectId(receiver_id)
    })
    const result = await databaseService.conversations.insertOne(conversation)
    conversation._id = result.insertedId
    socket.to(receiver_socket_id).emit('receiver_message', {
      payload: conversation
    })
  })
  socket.on('disconnect', () => {
    delete users[user_id]
    console.log(`User ${socket.id} disconnected`)
    console.log(users)
  })
})
httpServer.listen(PORT, () => {
  console.log(`Server running at http://${DOMAIN}:${PORT}/`)
})
