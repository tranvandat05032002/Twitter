import { Request } from 'express'
import User from './models/schemas/User.chema'
import { OTPPayload, TokenPayload } from './models/request/User.requests'
import Tweet from './models/schemas/Tweet.schema'
declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: TokenPayload
    refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
    decoded_forgot_password_token?: TokenPayload
    decoded_otp_token?: OTPPayload
    tweet?: Tweet
    file?: Express.Multer.File
  }
}
