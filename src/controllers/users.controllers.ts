import { ObjectId } from 'mongodb'
import { NextFunction, Request, Response } from 'express'
import User from '~/models/schemas/User.chema'
import { ParamsDictionary } from 'express-serve-static-core'
import usersService from '~/services/users.services'
import {
  ChangePasswordReqBody,
  FollowReqBody,
  ForgotPasswordReqBody,
  GetProfileIdParams,
  GetProfileParams,
  IRegisterReqBody,
  LoginReqBody,
  LogoutReqBody,
  OTPPayload,
  OTPReqBody,
  RefreshTokenReqBody,
  ResetPasswordReqBody,
  TokenPayload,
  UnfollowReqParams,
  UpdateMeReqBody,
  VerifyEmailReqBody
} from '~/models/request/User.requests'
import { USERS_MESSAGES } from '~/constants/message'
import databaseService from '~/services/database.services'
import HTTP_STATUS from '~/constants/httpStatus'
import { UserVerifyStatus } from '~/constants/enum'
import { envConfig } from '~/constants/config'
export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login({ user_id: user_id.toString(), verify: UserVerifyStatus.Verified })

  return res.json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, IRegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await usersService.register(req.body)
  return res.json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result
  })
}

export const logoutController = async (
  req: Request<ParamsDictionary, any, LogoutReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { refresh_token } = req.body
  const result = await usersService.logout(refresh_token)
  return res.json(result)
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { refresh_token } = req.body
  const { user_id, verify, exp } = req.decoded_authorization as TokenPayload
  const result = await usersService.refreshToken({ user_id, verify, refresh_token, exp })

  return res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}
export const verifyEmailTokenController = async (
  req: Request<ParamsDictionary, any, VerifyEmailReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  if (user.email_verify_token === '') {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  const result = await usersService.verifyEmail(user_id)

  return res.json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}

export const resendVerifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }

  const result = await usersService.resendVerifyEmail(user_id, user.email)

  return res.json(result)
}
export const findEmailController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { _id } = req.user as User
  const result = await usersService.findEmail({ user_id: (_id as ObjectId).toString() })

  return res.json(result)
}
export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { _id } = req.user as User
  const result = await usersService.forgotPassword({
    user_id: (_id as ObjectId)?.toString(),
    verify: UserVerifyStatus.Verified
  })
  return res.json(result)
}
export const verifyForgotPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
}

export const forgotPasswordOTPController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { _id, email } = req.user as User
  const result = await usersService.forgotPasswordOTP({
    user_id: (_id as ObjectId)?.toString(),
    email: email as string,
    verify: UserVerifyStatus.Verified
  })
  return res.json(result)
}
export const verifyOTPController = async (
  req: Request<ParamsDictionary, any, OTPReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { otp_auth } = req.body
  const { otp, exp, user_id } = req.decoded_otp_token as OTPPayload
  const result = await usersService.verifyOTP({ otp_auth, otp, exp, user_id })
  if (result) {
    return res.status(200).json('Verify OTP success')
  } else {
    return res.status(401).json('Verify OTP failed')
  }
}
export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { password } = req.body
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const result = await usersService.resetPassword({ user_id, password })

  return res.json(result)
}

export const resetPasswordOTPController = async (
  req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { password } = req.body
  const { user_id } = req.decoded_otp_token as OTPPayload
  const result = await usersService.resetPassword({
    user_id,
    password
  })
  return res.status(200).json(result)
}
export const resendPasswordOTPController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_otp_token as OTPPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  })
  const email = user?.email as string
  const result = await usersService.forgotPasswordOTP({ user_id, email, verify: UserVerifyStatus.Verified })

  return res.json(result)
}

export const getMeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersService.getMe(user_id)
  return res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user
  })
}
export const updateMeController = async (
  req: Request<ParamsDictionary, any, UpdateMeReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { body } = req
  const user = await usersService.updateMe(user_id, body)
  return res.json({
    message: USERS_MESSAGES.UPDATE_ME_SUCCESS,
    result: user
  })
}

export const getProfileController = async (req: Request<GetProfileParams>, res: Response, next: NextFunction) => {
  const { username } = req.params
  const user = await usersService.getProfile(username)
  return res.status(200).json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result: user
  })
}
export const getProfileIdController = async (req: Request<GetProfileIdParams>, res: Response, next: NextFunction) => {
  const { userId } = req.params
  const user = await usersService.getProfileUserId(userId)
  return res.status(200).json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result: user
  })
}


export const followController = async (
  req: Request<ParamsDictionary, any, FollowReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { followed_user_id } = req.body
  const result = await usersService.follows(user_id, followed_user_id)
  return res.status(200).json(result)
}

export const getUsersFollowingController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await usersService.getUsersFollowing(user_id)
  return res.status(200).json(result)
}

export const unfollowController = async (req: Request<UnfollowReqParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { user_id: followed_user_id } = req.params
  const result = await usersService.unfollows(user_id, followed_user_id)
  return res.json(result)
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { password } = req.body
  const result = await usersService.changePassword(user_id, password)
  return res.json(result)
}
export const oAuthController = async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.query
  const result = await usersService.oAuth(code as string)
  if (!result) return
  const urlRedirectVerify = `${envConfig.clientRedirectVerifyCallback}?token=${result.email_verify_token}&access_token=${result.access_token}&refresh_token=${result.refresh_token}&new_user=${result.newUser}&verify=${result.verify}`
  const urlRedirectHome = `${envConfig.clientRedirectHomeCallback}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&new_user=${result.newUser}&verify=${result.verify}`
  return res.redirect(result.verify === 0 ? urlRedirectVerify : urlRedirectHome)
}
