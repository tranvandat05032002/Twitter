import { Request } from 'express'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'
import { UPLOAD_DIR } from '~/constants/dir'
import { getNameFromFullName, handleUploadSingleImage } from '~/utils/file'

class MediaService {
  public async handleUploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req)
    const newFile = getNameFromFullName(file.newFilename)
    const newPath = path.resolve(UPLOAD_DIR, newFile + '.jpg')
    await sharp(file.filepath).jpeg().toFile(newPath)
    await fs.unlink(file.filepath)
    return `http://localhost:3000/upload/${newFile}.jpg`
  }
}
const mediaService = new MediaService()
export default mediaService
