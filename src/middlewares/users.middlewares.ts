import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
import { USERS_MESSAGES } from '~/constants/message'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { validate } from '~/utils/validation'
export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({
      message: 'Missing email or password'
    })
  }
  next()
}

export const registerValidator = validate(
  checkSchema({
    name: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
      },
      isString: {
        errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_55,
        options: {
          min: 1,
          max: 55
        }
      }
    },
    email: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
      },
      isEmail: {
        errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
      },
      trim: true,
      custom: {
        options: async (value) => {
          const isExistEmail = await usersService.checkExistEmail(value)
          if (isExistEmail) {
            throw new Error(USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE)
          }
          return true
        }
      }
    },
    password: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
      },
      isLength: {
        errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_4_TO_100,
        options: {
          min: 4,
          max: 100
        }
      },
      isStrongPassword: {
        options: {
          minLength: 4,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 0
        },
        errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
      }
    },
    confirm_password: {
      notEmpty: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isLength: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_4_TO_100,
        options: {
          min: 4,
          max: 100
        }
      },
      isStrongPassword: {
        errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG,
        options: {
          minLength: 4,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 0
        }
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
          }
          return true
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601,
        options: {
          strictSeparator: true,
          strict: true
        }
      }
    }
  })
)
