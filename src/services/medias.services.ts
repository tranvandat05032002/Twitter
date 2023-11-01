import { Request } from 'express'
import path from 'path'
import fsPromise from 'fs/promises'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
import { Media } from '~/models/Other'
import { EncodingStatus, MediaType } from '~/constants/enum'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import databaseService from './database.services'
import mime from 'mime'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import { ObjectId } from 'mongodb'
import { s3UploadFile } from '~/utils/s3'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
config()

class Queue {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }
  async enqueue(item: string) {
    this.items.push(item)
    const idName = getNameFromFullName(item.split('/').pop() as string)
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: idName,
        status: EncodingStatus.pending
      })
    )
    this.processEncode()
  }
  async processEncode() {
    if (this.encoding) return
    if (this.items.length > 0) {
      const videoPath = this.items[0]
      this.encoding = true
      const idName = getNameFromFullName(videoPath.split('/').pop() as string)
      await databaseService.videoStatus.updateOne(
        {
          name: idName
        },
        {
          $set: {
            status: EncodingStatus.processing
          },
          $currentDate: {
            update_at: true
          }
        }
      )
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.items.shift()
        await fsPromise.unlink(videoPath)
        await databaseService.videoStatus.updateOne(
          {
            name: idName
          },
          {
            $set: {
              status: EncodingStatus.success
            },
            $currentDate: {
              update_at: true
            }
          }
        )
        console.log(`Encode video ${videoPath} is success`)
      } catch (error) {
        await databaseService.videoStatus
          .updateOne(
            {
              name: idName
            },
            {
              $set: {
                status: EncodingStatus.failed
              },
              $currentDate: {
                update_at: true
              }
            }
          )
          .catch((err) => {
            console.log('Update video status error', err)
          })
        console.error(`Encode video ${videoPath} Error`)
        console.log(error)
      }
      this.encoding = false
      this.processEncode()
    } else {
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
        const newFileName = `${newFile}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFileName)
        await sharp(file.filepath).jpeg().toFile(newPath)
        const s3Result = await s3UploadFile({
          fileName: 'images/' + newFileName,
          filePath: newPath,
          contentType: mime.getType(newPath) as string
        })
        await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])
        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Image
          // url: isProduction
          //   ? `${process.env.HOST}/static/image/${newFileName}`
          //   : `http://localhost:${process.env.PORT}/static/image/${newFileName}`,
          // type: MediaType.Image
        }
      })
    )
    return result
  }
  public async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    console.log(files)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const s3Result = await s3UploadFile({
          fileName: 'videos/' + file.newFilename,
          filePath: file.filepath,
          contentType: mime.getType(file.filepath) as string
        })
        await fsPromise.unlink(file.filepath)
        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Video
        }
        // return {
        //   url: isProduction
        //     ? `${process.env.HOST}/static/video/${file.newFilename}`
        //     : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`,
        //   type: MediaType.Video
        // }
      })
    )
    return result
  }
  public async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideo(req)
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
  public async getVideoStatus(id: string) {
    const data = await databaseService.videoStatus.findOne({
      name: id
    })
    return data
  }
}
const mediaService = new MediaService()
export default mediaService
