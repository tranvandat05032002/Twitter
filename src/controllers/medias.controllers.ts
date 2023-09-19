import { NextFunction, Request, Response } from 'express'
import path from 'path'
import mediaService from '~/services/medias.services'

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediaService.handleUploadSingleImage(req)
  return res.status(200).json({
    result
  })
}
