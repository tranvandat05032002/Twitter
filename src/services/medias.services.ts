import { Request } from 'express'
import path from 'path'
import fsPromise from 'fs/promises'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
import { Media } from '~/models/Orther'
import { MediaType } from '~/constants/enum'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
config()
class MediaService {
  public async uploadImage(req: Request) {
    const file = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      file.map(async (file) => {
        const newFile = getNameFromFullName(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFile + '.jpg')
        await sharp(file.filepath).jpeg().toFile(newPath)
        await fsPromise.unlink(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newFile}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newFile}.jpg`,
          type: MediaType.Image
        }
      })
    )
    return result
  }
  public async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = files.map((file) => {
      return {
        url: isProduction
          ? `${process.env.HOST}/static/video/${file.newFilename}`
          : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`,
        type: MediaType.Video
      }
    })
    return result
  }
  public async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req)
    console.log(files)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        await encodeHLSWithMultipleVideoStreams(file.filepath)
        const newName = getNameFromFullName(file.newFilename)
        await fsPromise.unlink(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/video-hls/${newName}`
            : `http://localhost:${process.env.PORT}/static/video-hls/${newName}`,
          type: MediaType.VideoHLS
        }
      })
    )
    return result
  }
}
const mediaService = new MediaService()
export default mediaService
