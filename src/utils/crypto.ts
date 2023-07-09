import { createHash } from 'crypto'
import dotenv from 'dotenv'
dotenv.config()

export const sha256 = (content: string) => {
  return createHash('sha256').update(content).digest('hex')
}
export const hashPassword = (password: string) => {
  console.log(password + process.env.PASSWORD_SECRET)
  return sha256(password + process.env.PASSWORD_SECRET)
}
