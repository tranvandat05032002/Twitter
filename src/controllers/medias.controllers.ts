import { NextFunction, Request, Response } from 'express'
import path from 'path'
import { UPLOAD_DIR } from '~/constants/dir'
import mediaService from '~/services/medias.services'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediaService.uploadImage(req)
  return res.status(200).json({
    result
  })
}
export const ServeImageController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  return res.sendFile(path.resolve(UPLOAD_DIR, name), (err) => {
    if (err) {
      res.status((err as any).status).send('Not Found')
    }
  })
}
