/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
import { config } from 'dotenv'
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import fs from 'fs'
import path from 'path'
config()
// Create SES service object
const verifyEmailTemplate = fs.readFileSync(path.resolve('src/html/verify-email.html'), 'utf8')
const sesClient = new SESClient({
  region: process.env.AWS_REGION as string,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
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

export const sendVerifyEmail = ({ toAddress, subject, body }: { toAddress: string; subject: string; body: string }) => {
  const sendEmailCommand = createSendEmailCommand({
    fromAddress: process.env.SES_FROM_ADDRESS as string, // process.env.SES_FROM_ADDRESS
    toAddresses: toAddress,
    body,
    subject
  })
  return sesClient.send(sendEmailCommand)
}

export const sendVerifyRegisterEmail = (
  toAddress: string,
  email_verify_token: string,
  template: string = verifyEmailTemplate
) => {
  return sendVerifyEmail({
    toAddress,
    subject: 'Verify your email',
    body: template
      .replace('{{title}}', 'Please verify your email')
      .replace('{{content}}', 'Click the button below to verify your email')
      .replace('{{titleLink}}', 'Verify')
      .replace('{{link}}', `${process.env.CLIENT_URL}/verify?token=${email_verify_token}`)
  })
}
