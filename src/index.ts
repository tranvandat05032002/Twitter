import express from 'express'
import dotenv from 'dotenv'
import usersRouter from './routes/users.routers'
dotenv.config()
const app = express()

const PORT = process.env.PORT
const DOMAIN = process.env.DOMAIN
app.use(express.json())
app.use('/users', usersRouter)
app.listen(PORT, () => {
  console.log(`Server running at http://${DOMAIN}:${PORT}/`)
})
