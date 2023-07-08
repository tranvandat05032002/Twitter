import { Request, Response, NextFunction } from 'express'
import { checkSchema } from 'express-validator'
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
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 55
        }
      }
    },
    email: {
      isEmail: true,
      notEmpty: true,
      trim: true,
      custom: {
        options: async (value) => {
          const isExistEmail = await usersService.checkExistEmail(value)
          if (isExistEmail) {
            throw new Error('Email already exist')
          }
          return true
        }
      }
    },
    password: {
      notEmpty: true,
      isLength: {
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
        errorMessage: 'The password must be at least 4 characters, 1 uppercase, 1 number'
      }
    },
    confirm_password: {
      notEmpty: true,
      isLength: {
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
        }
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password')
          }
          return true
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        options: {
          strictSeparator: true,
          strict: true
        }
      }
    }
  })
)
