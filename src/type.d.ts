import { Request } from 'express'
import User from './models/schemas/User.chema'
import { TokenPayload } from './models/request/User.requests'
declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: TokenPayload
    refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
  }
}
