import User from '~/models/schemas/User.chema'
import databaseService from './database.services'
import { IRegisterReqBody, UpdateMeReqBody } from '~/models/request/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { USERS_MESSAGES } from '~/constants/message'
import nodemailer from 'nodemailer'
import { htmlVerify } from '~/html'
import { generateOTP } from '~/utils/handlers'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import Follower from '~/models/schemas/Follow.schema'
import axios from 'axios'
import { sendVerifyEmail, sendVerifyRegisterEmail } from '~/utils/email'
import { envConfig } from '~/constants/config'
import { sendVerifyResetPasswordEmail } from '~/utils/otp'
import { redisKey } from '~/utils/cacheKey'
import { getCache } from '~/utils/redisRead'
import { setCache } from '~/utils/redisWrite'
import { publishUserUpdated } from '~/kafka/users.publish'
import getRedisTTL from '~/utils/yaml'

interface INodeMailer {
  from?: string
  to: string
  subject: string
  html: string
}
class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      options: {
        expiresIn: envConfig.accessTokenExpiresIn
      },
      privateKey: envConfig.jwtSecretAccessToken as string
    })
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          exp
        },
        privateKey: envConfig.jwtSecretRefreshToken as string
      })
    }
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      options: {
        expiresIn: envConfig.refreshTokenExpiresIn
      },
      privateKey: envConfig.jwtSecretRefreshToken as string
    })
  }
  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      options: {
        expiresIn: envConfig.emailVerifyTokenExpiresIn
      },
      privateKey: envConfig.jwtSecretEmailVerifyToken as string
    })
  }
  public async sendEmailToken(mailModel: INodeMailer) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: false,
        auth: {
          user: 'tranvandatevondev0503@gmail.com',
          pass: 'mkhkbzpolcecemmy'
        }
      })
      return new Promise(function (resolve, reject) {
        const mailOptions = {
          from: mailModel.from || 'tranvandatevondev0503@gmail.com',
          to: mailModel.to,
          subject: mailModel.subject,
          // path front-end
          html: mailModel.html
        }

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log('Error sending email:', error)
            reject(error)
          } else {
            resolve(info.response)
          }
        })
      })
    } catch (error) {
      return Promise.reject(error)
    }
  }
  private signForgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      options: {
        expiresIn: envConfig.forgotPasswordTokenExpiresIn
      },
      privateKey: envConfig.jwtSecretForgotPasswordToken as string
    })
  }
  private SignAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }
  private decodedRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: envConfig.jwtSecretRefreshToken as string
    })
  }
  public async register(payload: IRegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        username: `@Twittername${user_id.toString().substring(user_id.toString().length - 6)}`,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    // verify emai with AWS
    await sendVerifyRegisterEmail(payload.email, email_verify_token)

    const [access_token, refresh_token] = await this.SignAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const decodedRefreshToken = await this.decodedRefreshToken(refresh_token)
    await databaseService.RefreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        iat: decodedRefreshToken.iat as number,
        exp: decodedRefreshToken.exp
      })
    )
    return {
      access_token,
      refresh_token,
      email_verify_token
    }
  }
  public async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.SignAccessAndRefreshToken({ user_id, verify })
    const decodedRefreshToken = await this.decodedRefreshToken(refresh_token)
    await databaseService.RefreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        iat: decodedRefreshToken.iat as number,
        exp: decodedRefreshToken.exp
      })
    )
    return {
      access_token,
      refresh_token
    }
  }
  private async getGoogleAuthToken(code: string) {
    const body = {
      code,
      client_id: envConfig.googleClientId as string,
      client_secret: envConfig.googleClientSecret,
      redirect_uri: envConfig.googleRedirectUri,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post(envConfig.googleTokenURI as string, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string
      id_token: string
    }
  }
  public async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      id: string
      email: string
      name: string
      verified_email: boolean
      picture: string
      given_name: string
      family_name: string
      local: string
    }
  }
  public async oAuth(code: string) {
    try {
      const { access_token, id_token } = await this.getGoogleAuthToken(code)
      const userInfo = await this.getGoogleUserInfo(access_token, id_token)
      if (!userInfo.verified_email) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.GMAIL_NOT_VERIFIED,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
      const user = await databaseService.users.findOne({
        email: userInfo.email
      })
      if (user) {
        const [access_token, refresh_token] = await this.SignAccessAndRefreshToken({
          user_id: user._id.toString(),
          verify: user.verify
        })
        const decodedRefreshToken = await this.decodedRefreshToken(refresh_token)
        await databaseService.RefreshTokens.insertOne(
          new RefreshToken({
            user_id: user._id,
            token: refresh_token,
            iat: decodedRefreshToken.iat as number,
            exp: decodedRefreshToken.exp
          })
        )
        return {
          access_token,
          refresh_token,
          newUser: 0,
          email_verify_token: '',
          verify: user.verify
        }
      } else {
        const passwordOAuth = (Math.random() + 1).toString(36).substring(3, 15) + 'D'
        const data = await this.register({
          email: userInfo.email,
          name: userInfo.name,
          date_of_birth: new Date().toISOString(),
          password: passwordOAuth,
          confirm_password: passwordOAuth
        })
        return {
          ...data,
          newUser: 1,
          email_verify_token: data.email_verify_token,
          verify: UserVerifyStatus.Unverified
        }
      }
    } catch (error) {
      console.log(error)
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
  public async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
    exp?: number
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
      databaseService.RefreshTokens.deleteOne({ token: refresh_token })
    ])
    const decodedRefreshToken = await this.decodedRefreshToken(new_refresh_token)
    await databaseService.RefreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token,
        iat: decodedRefreshToken.iat as number,
        exp: decodedRefreshToken.exp
      })
    )
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }
  public async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.SignAccessAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne(
        {
          _id: new ObjectId(user_id)
        },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
    ])

    const [access_token, refresh_token] = token
    const decodedRefreshToken = await this.decodedRefreshToken(refresh_token)
    await databaseService.RefreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        iat: decodedRefreshToken.iat as number,
        exp: decodedRefreshToken.exp
      })
    )
    return {
      access_token,
      refresh_token
    }
  }

  public async resendVerifyEmail(user_id: string, email: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    // verify email with AWS
    await sendVerifyRegisterEmail(email, email_verify_token)

    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }
  public async findEmail({ user_id }: { user_id: string }) {
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    return {
      message: USERS_MESSAGES.EMAIL_FIND_SUCCESS,
      user
    }
  }
  public async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPassword({ user_id, verify })
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    // send email and link to email of userL https://twitter.com/forgot-password?token=token
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }

  public async forgotPasswordOTP({
    user_id,
    email,
    verify
  }: {
    user_id: string
    email: string
    verify: UserVerifyStatus
  }) {
    const otp = generateOTP()
    const salt = await bcrypt.genSalt(10)
    const hashedOTP = await bcrypt.hash(otp, salt)
    const jwtToken = jwt.sign(
      {
        otp,
        user_id
      },
      envConfig.jwtSecretOTP as string,
      {
        expiresIn: '5m'
      }
    )
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          forgot_password_token: hashedOTP
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    try {
      sendVerifyResetPasswordEmail(email, otp)
    } catch (error) {
      console.log(error)
    }
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD,
      jwtToken
    }
  }

  public async verifyOTP({
    otp_auth,
    otp,
    exp,
    user_id
  }: {
    otp_auth: string //otp body
    otp: string // otp of decoded
    exp: number
    user_id: string // get otp hash bcrypt
  }) {
    const { user } = await this.findEmail({
      user_id
    })
    const isValidOTP = await bcrypt.compare(otp_auth, user?.forgot_password_token as string)
    return Boolean(isValidOTP)
  }
  public async resetPassword({ user_id, password }: { user_id: string; password: string }) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: ''
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    }
  }
  public async getMe(user_id: string) {
    // Lấy thông tin của người đăng nhập hiện tại từ cache
    const cacheKey = redisKey.userMe(user_id)
    const userCached = await getCache<{ user: any }>(cacheKey)
    if (userCached) {
      return {
        user: userCached
      }
    }

    // Lấy thông tin user từ DB nếu không có trong cache
    const user = await databaseService.users.findOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )

    // Cập nhật cho cache
    if (!user) {
      // Tránh spam khi user không có và hit DB liên tục
      await setCache(redisKey.userMe(user_id), 60)
      return {
        user: null
      }
    }
    await setCache(redisKey.userMe(user_id), user, getRedisTTL())
    return {
      user
    }
  }
  public async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = (
      payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    ) as UpdateMeReqBody & { date_of_birth?: Date }
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          ..._payload
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )

    const updateUser = user.value
    if (updateUser) {
      await publishUserUpdated({
        user_id,
        userData: updateUser
      })
    }

    return updateUser
  }
  public async getProfile(username: string, currentUserId: string) {
    const cacheKey = redisKey.userProfile(username)
    const userCached = await getCache<{
      user: User;
      is_following: boolean;
    }>(cacheKey);
    if (userCached) {
      return userCached;
    }

    const user = await databaseService.users.findOne(
      {
        username
      },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          updated_at: 0
        }
      }
    )

    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    const plainUser = JSON.parse(JSON.stringify(user))

    // Kiểm tra xem currentUser có theo dõi user này không
    const isFollowing = await databaseService.followers.findOne({
      user_id: new ObjectId(currentUserId),
      followed_user_id: user._id
    })

    const result = {
      ...user,
      is_following: Boolean(isFollowing),
    };

    await setCache(cacheKey, result, getRedisTTL());

    return result
  }
  public async getProfileUserId(userId: string) {
    const user = await databaseService.users.findOne(
      {
        _id: new ObjectId(userId)
      },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          updated_at: 0
        }
      }
    )
    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }
  public async follows(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower === null) {
      await databaseService.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      )

      return {
        message: USERS_MESSAGES.FOLLOW_SUCCESS
      }
    }
    return {
      message: USERS_MESSAGES.FOLLOWED
    }
  }
  public async unfollows(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower === null) {
      return {
        message: USERS_MESSAGES.ALREADY_UNFOLLOWED
      }
    }
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESS
    }
  }
  public async getUsersFollowing(user_id: string) {
    const [users, total] = await Promise.all([
      databaseService.followers
        .aggregate<any>(
          [
            {
              $match: {
                user_id: new ObjectId(user_id)
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'followed_user_id',
                foreignField: '_id',
                as: 'followUsers'
              }
            },
            {
              $unwind: {
                path: '$followUsers'
              }
            },
            {
              $project: {
                followed_user_id: 0,
                created_at: 0,
                user_id: 0,
                'followUsers.password': 0,
                'followUsers.email_verify_token': 0,
                'followUsers.forgot_password_token': 0,
                'followUsers.created_at': 0,
                'followUsers.updated_at': 0,
              }
            }
          ]
        )
        .toArray(),
      databaseService.followers.countDocuments({
        user_id: new ObjectId(user_id),
      })
    ])
    return {
      users,
      total
    }
  }
  public async changePassword(user_id: string, password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
    }
  }

  public async updateLastSeen(user_id: string, last_online: string) {
    return await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(user_id)
      },
      { $set: { last_online: new Date(last_online) } }
    );
  }
}

const usersService = new UsersService()
export default usersService
