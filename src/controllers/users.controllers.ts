import { ObjectId } from 'mongodb'
import { NextFunction, Request, Response } from 'express'
import { User } from '~/models/schemas/User.chema'
import { ParamsDictionary } from 'express-serve-static-core'
import usersService from '~/services/users.services'
import { IRegisterReqBody } from '~/models/request/User.requests'
export const loginController = async (req: Request, res: Response) => {
  // throw new Error('123')
  const { user }: any = req
  const user_id = user._id as ObjectId
  const result = await usersService.login(user_id.toString())

  return res.json({
    message: 'Login success',
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
    message: 'Register success',
    result
  })
}
