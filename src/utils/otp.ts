/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import fs from 'fs'
import path from 'path'
import { envConfig } from '~/constants/config'
// Create SES service object
const verifyEmailTemplate = fs.readFileSync(path.resolve('src/html/verify-otp.html'), 'utf8')
const sesClient = new SESClient({
  region: envConfig.awsRegion as string,
  credentials: {
    secretAccessKey: envConfig.awsSecretAccessKey as string,
    accessKeyId: envConfig.awsAccessKeyId as string
  }
})
// create send mail command
const createSendEmailCommand = ({
  fromAddress,
  toAddresses,
  ccAddresses = [],
  body,
  subject,
  replyToAddresses = []
}: {
  fromAddress: string
  toAddresses: string | string[]
  ccAddresses?: string | string[]
  body: string
  subject: string
  replyToAddresses?: string | string[]
}) => {
  return new SendEmailCommand({
    Destination: {
      /* required */
      CcAddresses: ccAddresses instanceof Array ? ccAddresses : [ccAddresses],
      ToAddresses: toAddresses instanceof Array ? toAddresses : [toAddresses]
    },
    Message: {
      /* required */
      Body: {
        /* required */
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: fromAddress,
    ReplyToAddresses: replyToAddresses instanceof Array ? replyToAddresses : [replyToAddresses]
  })
}

export const sendOTPVerifyEmail = ({
  toAddress,
  subject,
  body
}: {
  toAddress: string
  subject: string
  body: string
}) => {
  const sendEmailCommand = createSendEmailCommand({
    fromAddress: envConfig.sesFromAddress as string,
    toAddresses: toAddress,
    body,
    subject
  })
  return sesClient.send(sendEmailCommand)
}

export const sendVerifyResetPasswordEmail = (
  toAddress: string,
  otp_verify_token: string,
  template: string = verifyEmailTemplate
) => {
  return sendOTPVerifyEmail({
    toAddress,
    subject: 'OTP verification',
    body: template
      .replace('{{title}}', 'hi,')
      .replace(
        '{{content}}',
        `Please use the following. One Time Password (OTP) to access the form: ${otp_verify_token}, Do not share this OTP with anyone. `
      )
  })
}
