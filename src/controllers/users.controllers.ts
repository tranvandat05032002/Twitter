import { NextFunction, Request, Response } from 'express'
import { User } from '~/models/schemas/User.chema'
import databaseService from '~/services/database.services'
import { ParamsDictionary } from 'express-serve-static-core'
import usersService from '~/services/users.services'
import { IRegisterReqBody } from '~/models/request/User.requests'
export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'tranvandat0503@gmail.com' && password === '35701537scss') {
    return res.status(200).json({
      message: 'Login success'
    })
  }
  return res.status(400).json({
    message: 'Login failed'
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
