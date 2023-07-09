import jwt, { SignOptions } from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
export const signToken = ({
  payload,
  privateKey,
  options = { algorithm: 'HS256' }
}: {
  payload: string | Buffer | object
  privateKey: string
  options?: SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      const resultSignToken = err ? reject(err) : resolve(token as string)

      return resultSignToken
    })
  })
}
