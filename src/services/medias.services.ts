import { Request } from 'express'
import { handleUploadSingleImage } from '~/utils/file'

class MediaService {
  public async handleUploadSingleImage(req: Request) {
    const data = await handleUploadSingleImage(req)

    return data
  }
}
const mediaService = new MediaService()
export default mediaService
