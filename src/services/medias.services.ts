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

class Queue {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }
  enqueue(item: string) {
    this.items.push(item)
    this.processEncode()
  }
  async processEncode() {
    if (this.encoding) return
    if (this.items.length > 0) {
      const videoPath = this.items[0]
      this.encoding = true
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.items.shift()
        await fsPromise.unlink(videoPath)
        console.log(`Encode video ${videoPath} is success`)
      } catch (error) {
        console.error(`Encode video ${videoPath} Error`)
        console.log(error)
      }
      this.encoding = false
      this.processEncode()
    } else {
      this.encoding = true
      console.log('Encode video is empty')
    }
  }
}
const queue = new Queue()
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
        const newName = getNameFromFullName(file.newFilename)
        queue.enqueue(file.filepath)
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
