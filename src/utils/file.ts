import { Request } from 'express'
import { File } from 'formidable'
import fs from 'fs'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true // create folder nested
      })
    }
  })
}

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    keepExtensions: true,
    maxFiles: 4,
    maxFileSize: 500 * 1024, // 500KB
    maxTotalFileSize: 400 * 1025 * 4,
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not value') as any)
      }
      return valid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'))
      }
      resolve(files.image as File[])
    })
  })
}
//video
export const handleUploadVideo = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIR,
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not value') as any)
      }
      return valid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.video)) {
        return reject(new Error('File is empty'))
      }
      const videos = files.video as File[]
      videos.forEach((video) => {
        const ext = getExtensionName(video.originalFilename as string)
        fs.renameSync(video.filepath, video.filepath + '.' + ext)
        video.newFilename = video.newFilename + '.' + ext
      })
      resolve(files.video as File[])
    })
  })
}

export const getNameFromFullName = (fullName: string) => {
  const name = fullName.split('.')
  name.pop()
  return name.join('')
}

export const getExtensionName = (fullname: string) => {
  const arrName = fullname.split('.')
  return arrName[arrName.length - 1]
}
