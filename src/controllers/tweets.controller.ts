import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'

export const createTweetController = async (req: Request<ParamsDictionary, any>, res: Response) => {
  return res.json('Create Tweet success')
}
