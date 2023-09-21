import { NextFunction, Request, Response } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import mediaService from '~/services/medias.services'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaService.uploadImage(req)
  return res.status(200).json({
    result: url
  })
}
export const ServeImageController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    if (err) {
      res.status((err as any).status).send('Not Found')
    }
  })
}
export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaService.uploadVideo(req)
  return res.status(200).json({
    result: url
  })
}

export const ServeVideoController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, name), (err) => {
    if (err) {
      res.status((err as any).status).send('Not Found')
    }
  })
}
