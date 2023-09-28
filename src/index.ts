import express from 'express'
import dotenv from 'dotenv'
import usersRouter from './routes/users.routers'
import databaseService from './services/database.services'
import { defaultHandleError } from './middlewares/errors.middlewares'
import cors from 'cors'
import mediasRouter from './routes/medias.routers'
import { initFolder } from './utils/file'
import { UPLOAD_VIDEO_DIR } from './constants/dir'
import staticRouter from './routes/statics.routers'
dotenv.config()
const app = express()
// app.use(cors())

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}
app.use(cors(corsOptions))
databaseService.connect().then(() => {
  databaseService.indexUser()
  databaseService.indexRefreshToken()
  databaseService.indexFollower()
  databaseService.indexVideoStatus()
})
const PORT = process.env.PORT
const DOMAIN = process.env.DOMAIN

initFolder()
app.use(express.json())
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/static/video', express.static(UPLOAD_VIDEO_DIR))
app.use(defaultHandleError)

app.listen(PORT, () => {
  console.log(`Server running at http://${DOMAIN}:${PORT}/`)
})
