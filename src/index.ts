import express, { NextFunction, Request, Response } from 'express'
import dotenv from 'dotenv'
import usersRouter from './routes/users.routers'
import databaseService from './services/database.services'
import { defaultHandleError } from './middlewares/errors.middlewares'
dotenv.config()
const app = express()

databaseService.connect()
const PORT = process.env.PORT
const DOMAIN = process.env.DOMAIN

app.use(express.json())
app.use('/users', usersRouter)
app.use(defaultHandleError)

app.listen(PORT, () => {
  console.log(`Server running at http://${DOMAIN}:${PORT}/`)
})
