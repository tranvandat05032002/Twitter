import Express from 'express'
export default function wrapRequestHandler(Func: Express.RequestHandler) {
  return async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    try {
      await Func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
export const normalization = (value: string) => {
  const trimValue = value.trim().split(' ')
  let resultValue = ''
  for (let i = 0; i < trimValue.length; i++) {
    if (trimValue[i] !== '') {
      const firstChar = trimValue[i].charAt(0)
      const restChar = trimValue[i].substring(1)
      const upperFirst = firstChar.toUpperCase()
      resultValue += upperFirst + restChar + ' '
    }
  }
  return resultValue.trim()
}

// Fisher-Yates
export function generateOTP() {
  const digits = '0123456789'
  const otpArray = digits.split('')
  let OTP = ''

  for (let i = otpArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[otpArray[i], otpArray[j]] = [otpArray[j], otpArray[i]]
  }

  for (let i = 0; i < 6; i++) {
    OTP += otpArray[i]
  }

  return OTP
}
