import { Request } from 'express'
import path from 'path'
import fsPromise from 'fs/promises'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { getFiles, getNameFromFullName, handleUploadImage, handleUploadImageAvatar, handleUploadImageCoverPhoto, handleUploadVideo } from '~/utils/file'
import { envConfig, isProduction } from '~/constants/config'
import { Media } from '~/models/Other'
import { EncodingStatus, MediaType } from '~/constants/enum'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import databaseService from './database.services'
import mime from 'mime'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import { s3UploadFile } from '~/utils/s3'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
import { rimrafSync } from 'rimraf'
import { execFile } from "child_process";
import ffmpegPath from "ffmpeg-static"; // Sử dụng ffmpeg-static thay vì fluent-ffmpeg
import ffprobePath from "@ffprobe-installer/ffprobe";

interface UploadVoiceResponse {
  url: string;
  duration: number;
  codec: string;
}

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
      this.encoding = true
      const videoPath = this.items[0]
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
            updated_at: true
          }
        }
      )
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.items.shift()
        const files = getFiles(path.resolve(UPLOAD_VIDEO_DIR, idName))
        await Promise.all(
          files.map((filePath) => {
            const fileName = 'videos-hls' + filePath.replace(path.resolve(UPLOAD_VIDEO_DIR), '')
            return s3UploadFile({
              fileName,
              filePath,
              contentType: mime.getType(filePath) as string
            })
          })
        )
        rimrafSync(path.resolve(UPLOAD_VIDEO_DIR, idName))
        await databaseService.videoStatus.updateOne(
          {
            name: idName
          },
          {
            $set: {
              status: EncodingStatus.success
            },
            $currentDate: {
              updated_at: true
            }
          }
        )
        console.log(`Encode video ${videoPath} success`)
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
                updated_at: true
              }
            }
          )
          .catch((err) => {
            console.error('Update video status error', err)
          })
        console.error(`Encode video ${videoPath} error`)
        console.error(error)
      }
      this.encoding = false
      this.processEncode()
    } else {
      console.log('Encode video queue is empty')
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
          //   ? `${envConfig.host}/static/image/${newFileName}`
          //   : `http://localhost:${envConfig.port}/static/image/${newFileName}`,
          // type: MediaType.Image
        }
      })
    )
    return result
  }
  public async uploadImageAvatar(req: Request) {
    const file = await handleUploadImageAvatar(req)
    const result: Media[] = await Promise.all(
      file.map(async (file) => {
        const newFile = getNameFromFullName(file.newFilename)
        const newFileName = `${newFile}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFileName)
        await sharp(file.filepath).jpeg().toFile(newPath)
        const s3Result = await s3UploadFile({
          fileName: 'images-avatar/' + newFileName,
          filePath: newPath,
          contentType: mime.getType(newPath) as string
        })
        await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])
        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Image
          // url: isProduction
          //   ? `${envConfig.host}/static/image/${newFileName}`
          //   : `http://localhost:${envConfig.port}/static/image/${newFileName}`,
          // type: MediaType.Image
        }
      })
    )
    return result
  }
  public async uploadImageCoverPhoto(req: Request) {
    const file = await handleUploadImageCoverPhoto(req)
    const result: Media[] = await Promise.all(
      file.map(async (file) => {
        const newFile = getNameFromFullName(file.newFilename)
        const newFileName = `${newFile}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFileName)
        await sharp(file.filepath).jpeg().toFile(newPath)
        const s3Result = await s3UploadFile({
          fileName: 'images-cover-photo/' + newFileName,
          filePath: newPath,
          contentType: mime.getType(newPath) as string
        })
        await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])
        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Image
          // url: isProduction
          //   ? `${envConfig.host}/static/image/${newFileName}`
          //   : `http://localhost:${envConfig.port}/static/image/${newFileName}`,
          // type: MediaType.Image
        }
      })
    )
    return result
  }
  public async uploadImageTweet(req: Request) {
    const file = await handleUploadImageCoverPhoto(req)
    const result: Media[] = await Promise.all(
      file.map(async (file) => {
        const newFile = getNameFromFullName(file.newFilename)
        const newFileName = `${newFile}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFileName)
        await sharp(file.filepath).jpeg().toFile(newPath)
        const s3Result = await s3UploadFile({
          fileName: 'images-tweet/' + newFileName,
          filePath: newPath,
          contentType: mime.getType(newPath) as string
        })
        await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])
        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Image
          // url: isProduction
          //   ? `${envConfig.host}/static/image/${newFileName}`
          //   : `http://localhost:${envConfig.port}/static/image/${newFileName}`,
          // type: MediaType.Image
        }
      })
    )
    return result
  }
  public async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const s3Result = await s3UploadFile({
          fileName: 'videos/' + file.newFilename,
          filePath: file.filepath,
          contentType: mime.getType(file.filepath) as string
        })
        fsPromise.unlink(file.filepath)
        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Video
        }
        // return {
        //   url: isProduction
        //     ? `${envConfig.host}/static/video/${file.newFilename}`
        //     : `http://localhost:${envConfig.port}/static/video/${file.newFilename}`,
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
            ? `${envConfig.host}/static/video-hls/${newName}/master.m3u8`
            : `http://localhost:${envConfig.port}/static/video-hls/${newName}/master.m3u8`,
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

  // voice
  public async uploadVoiceFile(inputPath: string) {
    try {
      // Lấy duration của file
      const duration = await probeDuration(inputPath);

      // Tạo tên file đầu ra và đường dẫn
      const outName = path.basename(inputPath, ".webm") + ".m4a";
      const outPath = path.join(path.dirname(inputPath), outName);

      // Chuyển đổi tệp âm thanh sang m4a
      await convertToM4A(inputPath, outPath);

      // Trả về URL file và thông tin liên quan
      const url = `http://localhost:4000/static/voice/${outName}`;
      return { url, duration, codec: "m4a" };
    } catch (error) {
      console.error("Error uploading or processing voice file:", error);
      throw new Error("Error processing the voice file.");
    }
  }
}

// Hàm lấy duration của file âm thanh
function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobeExecutablePath = ffprobePath.path
    execFile(ffprobeExecutablePath, ["-v", "quiet", "-print_format", "json", "-show_format", filePath], (err, stdout, stderr) => {
      if (err) {
        console.error(`Error probing file duration: ${stderr}`);
        return reject(err);
      }
      try {
        const data = JSON.parse(stdout);
        const duration = parseFloat(data.format.duration);
        resolve(Math.round(duration)); // Giây
      } catch (error) {
        console.error("Error parsing ffprobe output:", error);
        reject(error);
      }
    });
  });
}

// Hàm chuyển đổi file từ webm sang m4a (AAC)
function convertToM4A(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      console.error("ffmpegPath is null or undefined. Cannot proceed with conversion.");
      return reject(new Error("ffmpegPath is null or undefined"));
    }

    // Nếu ffmpegPath không phải là null, gọi execFile với ffmpegPath
    execFile(ffmpegPath, ["-i", input, "-c:a", "aac", "-f", "ipod", output], (err, stdout, stderr) => {
      if (err) {
        console.error(`Error converting file: ${stderr}`);
        return reject(err);
      }
      console.log(`Conversion complete: ${stdout}`);
      resolve();
    });
  });
}

const mediaService = new MediaService()
export default mediaService
