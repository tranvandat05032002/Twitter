import { checkSchema } from 'express-validator'
import { MediaTypeQuery, PeopleFollowType } from '~/constants/enum'
import { SEARCH_MESSAGES } from '~/constants/message'
import { validate } from '~/utils/validation'

export const searchValidator = validate(
  checkSchema(
    {
      content: {
        isString: {
          errorMessage: SEARCH_MESSAGES.SEARCH_CONTENT_IS_STRING
        }
      },
      media_type: {
        optional: true,
        isIn: {
          options: [Object.values(MediaTypeQuery)]
        },
        errorMessage: `Media type must be one of ${Object.values(MediaTypeQuery).join(', ')}`
      },
      people_follow: {
        optional: true,
        isIn: {
          options: [Object.values(PeopleFollowType)]
        },
        errorMessage: SEARCH_MESSAGES.SEARCH_PEOPLE_FOLLOW_ON_OR_OFF
      }
    },
    ['query']
  )
)
