import { Request } from 'express'
import { File } from 'formidable'
import fs from 'fs'
import { UPLOAD_TEMP_DIR } from '~/constants/dir'
export const initFolder = () => {
  const uploadFolderFile = UPLOAD_TEMP_DIR
  if (!fs.existsSync(uploadFolderFile)) {
    fs.mkdirSync(uploadFolderFile, {
      recursive: true // create folder nested
    })
  }
}

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: UPLOAD_TEMP_DIR,
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

export const getNameFromFullName = (fullName: string) => {
  const name = fullName.split('.')
  name.pop()
  return name.join('')
}
