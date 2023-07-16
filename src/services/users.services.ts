import User from '~/models/schemas/User.chema'
import databaseService from './database.services'
import { IRegisterReqBody } from '~/models/request/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import dotenv from 'dotenv'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { USERS_MESSAGES } from '~/constants/message'
dotenv.config()

class UsersService {
  private signAccessToken({ user_id }: { user_id: string }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
    })
  }

  private signRefreshToken({ user_id }: { user_id: string }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }
  private signEmailVerifyToken({ user_id }: { user_id: string }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken
      },
      options: {
        expiresIn: process.env.VERIFY_EMAIL_TOKEN_EXPIRES_IN
      },
      privateKey: process.env.JWT_SECRET_EMAIL_TOKEN as string
    })
  }
  private SignAccessAndRefreshToken({ user_id }: { user_id: string }) {
    return Promise.all([this.signAccessToken({ user_id }), this.signRefreshToken({ user_id })])
  }
  public async register(payload: IRegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({ user_id: user_id.toString() })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const [access_token, refresh_token] = await this.SignAccessAndRefreshToken({ user_id: user_id.toString() })
    await databaseService.RefreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }
  public async login(user_id: string) {
    const [access_token, refresh_token] = await this.SignAccessAndRefreshToken({ user_id })
    await databaseService.RefreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )
    return {
      access_token,
      refresh_token
    }
  }
  public async checkExistEmail(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
  public async logout(refresh_token: string) {
    await databaseService.RefreshTokens.deleteOne({ token: refresh_token })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }
  public async refreshToken({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id }),
      this.signRefreshToken({ user_id }),
      databaseService.RefreshTokens.deleteOne({ token: refresh_token })
    ])
    await databaseService.RefreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token
      })
    )
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }
  public async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.SignAccessAndRefreshToken({ user_id }),
      databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
        },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified,
            updated_at: new Date()
          }
        }
      )
    ])

    const [access_token, refresh_token] = token
    return {
      access_token,
      refresh_token
    }
  }
}

const usersService = new UsersService()
export default usersService
