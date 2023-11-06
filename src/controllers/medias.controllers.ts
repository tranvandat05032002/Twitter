import { NextFunction, Request, Response } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import HTTP_STATUS from '~/constants/httpStatus'
import mediaService from '~/services/medias.services'
import fs from 'fs'
import mime from 'mime'
import { USERS_MESSAGES } from '~/constants/message'
import { sendFileFromS3 } from '~/utils/s3'

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
export const uploadVideoHLSController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaService.uploadVideoHLS(req)
  return res.status(200).json({
    result: url
  })
}
export const serveM3u8Controller = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  sendFileFromS3(res, `videos-hls/${id}/master.m3u8`)
  // return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8'), (err) => {
  //   if (err) {
  //     res.status((err as any).status).send('Not found')
  //   }
  // })
}
export const serveSegmentController = (req: Request, res: Response, next: NextFunction) => {
  const { id, v, segment } = req.params
  sendFileFromS3(res, `videos-hls/${id}/${v}/${segment}`)

  // return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v, segment), (err) => {
  //   if (err) {
  //     res.status((err as any).status).send('Not found')
  //   }
  // })
}
export const videoStatusController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const result = await mediaService.getVideoStatus(id as string)
  return res.status(200).json({
    message: USERS_MESSAGES.GET_VIDEO_STATUS_SUCCESS,
    result: result
  })
}
export const ServeVideoStreamingController = (req: Request, res: Response, next: NextFunction) => {
  const range = req.headers.range
  if (!range) {
    res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header')
  }
  const { name } = req.params
  // get Path of video streamer
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name)
  // Decimal system (10): 1MB = 10 ^ 6
  // Binary system: 1MB = 2^20 = 1024 * 1024
  // get Size of video
  const videoSize = fs.statSync(videoPath).size
  // create the size a chunk of video
  const CHUNK_SIZE = 10 ** 6 // 1MB
  //get bytes start
  const start = Number(range?.replace(/\D/g, ''))
  // get bytes end
  const end = Math.min(start + CHUNK_SIZE, videoSize)
  //size of chunk's video
  const contentLength = end - start
  const contentType = mime.getType(videoPath) || 'video/*'
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }

  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}
