import { ErrorEntity, ErrorWithStatus } from '../models/Errors'
import { Request, Response, NextFunction } from 'express'
import { validationResult, ValidationChain } from 'express-validator'
import HTTP_STATUS from '~/constants/httpStatus'
// can be reused by many routes
// RunnableValidationChains<ValidationChain>
// sequential processing, stops running validations chain if the previous one fails.
type SingleError = { [key: string]: any; msg: string }
type ErrorsType = Record<string, SingleError>

export const validate = (chains: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(chains.map((c) => c.run(req)))

    const result = validationResult(req)
    if (result.isEmpty()) return next()

    const errorsObject = result.mapped()
    const errorEntity = new ErrorEntity({ errors: {} as ErrorsType })

    for (const key in errorsObject) {
      const { msg } = errorsObject[key]
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      errorEntity.errors[key] = errorsObject[key]
    }

    return next(errorEntity)
  }
}
