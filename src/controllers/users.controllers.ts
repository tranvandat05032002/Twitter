import { ObjectId } from 'mongodb'
import { NextFunction, Request, Response } from 'express'
import User, { IUser } from '~/models/schemas/User.chema'
import { ParamsDictionary } from 'express-serve-static-core'
import usersService from '~/services/users.services'
import { IRegisterReqBody, LogoutReqBody, RefreshTokenReqBody, TokenPayload } from '~/models/request/User.requests'
import { USERS_MESSAGES } from '~/constants/message'
import databaseService from '~/services/database.services'
import { truncate } from 'fs/promises'
import HTTP_STATUS from '~/constants/httpStatus'
export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId
  const result = await usersService.login(user_id.toString())

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
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await usersService.refreshToken({ user_id, refresh_token })

  return res.json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}
export const verifyEmailTokenController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = (await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  })) as IUser
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
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
  return true
}
