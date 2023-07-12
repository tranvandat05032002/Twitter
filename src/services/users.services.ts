import { User } from '~/models/schemas/User.chema'
import databaseService from './database.services'
import { IRegisterReqBody } from '~/models/request/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import dotenv from 'dotenv'
import { TokenType } from '~/constants/enum'
import { ObjectId } from 'mongodb'
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
      privateKey: process.env.JWT_SECRET as string
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
      privateKey: process.env.JWT_SECRET as string
    })
  }
  private SignAccessAndRefreshToken({ user_id }: { user_id: string }) {
    return Promise.all([this.signAccessToken({ user_id }), this.signRefreshToken({ user_id })])
  }
  public async register(payload: IRegisterReqBody) {
    const user_id = new ObjectId()
    await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const [accessToken, refreshToken] = await this.SignAccessAndRefreshToken({ user_id: user_id.toString() })
    return {
      accessToken,
      refreshToken
    }
  }
  public async login(user_id: string) {
    const [accessToken, refreshToken] = await this.SignAccessAndRefreshToken({ user_id })
    return {
      accessToken,
      refreshToken
    }
  }
  public async checkExistEmail(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
}

const usersService = new UsersService()
export default usersService
