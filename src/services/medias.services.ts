import { Request } from 'express'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'
import { UPLOAD_DIR } from '~/constants/dir'
import { getNameFromFullName, handleUploadImage } from '~/utils/file'
import { isProduction } from '~/constants/config'
import { config } from 'dotenv'
import { Media } from '~/models/Orther'
import { MediaType } from '~/constants/enum'
config()
class MediaService {
  public async uploadImage(req: Request) {
    const file = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      file.map(async (file) => {
        const newFile = getNameFromFullName(file.newFilename)
        const newPath = path.resolve(UPLOAD_DIR, newFile + '.jpg')
        await sharp(file.filepath).jpeg().toFile(newPath)
        await fs.unlink(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/${newFile}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newFile}.jpg`,
          type: MediaType.Image
        }
      })
    )
    return result
  }
}
const mediaService = new MediaService()
export default mediaService
