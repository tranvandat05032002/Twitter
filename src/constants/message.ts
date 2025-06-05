export const USERS_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  NAME_LENGTH_MUST_BE_FROM_1_TO_55: 'Name length must be from 1 to 55',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_IS_INVALID: 'Email is invalid',
  EMAIL_OR_PASSWORD_IS_INCORRECT: 'Email or password is incorrect',
  EMAIL_FIND_SUCCESS: 'Email found in our system.',
  EMAIL_NOT_FOUND: 'Email not found',
  OTP_IS_INVALID: 'OTP is invalid',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
  PASSWORD_LENGTH_MUST_BE_FROM_4_TO_100: 'Password length must be from 4 to 100',
  PASSWORD_MUST_BE_STRONG:
    'Password must be 4-100 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_4_TO_100: 'Confirm password length must be from 4 to 100',
  CONFIRM_PASSWORD_MUST_BE_STRONG:
    'Confirm password must be 6-50 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number',
  CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD: 'Confirm password must be the same as password',
  DATE_OF_BIRTH_MUST_BE_ISO8601: 'Date of birth must be ISO8601',
  DATE_OF_BIRTH_IS_REQUIRED: 'Date of birth is required',
  LOGIN_SUCCESS: 'Login success',
  REGISTER_SUCCESS: 'Register success',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  OTP_TOKEN_IS_REQUIRED: 'Access token is required',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_IS_INVALID: 'Refresh token is invalid',
  USED_REFRESH_TOKEN_OR_NOT_EXIST: 'Used refresh token or not exist',
  LOGOUT_SUCCESS: 'Logout success',
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token is required',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_VERIFIED_BEFORE: 'Email already verified before',
  EMAIL_VERIFY_SUCCESS: 'Email verify success',
  RESEND_VERIFY_EMAIL_SUCCESS: 'Resend verify email success',
  CHECK_EMAIL_TO_RESET_PASSWORD: 'Check email to reset password',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token is required',
  VERIFY_FORGOT_PASSWORD_SUCCESS: 'Verify forgot password success',
  INVALID_FORGOT_PASSWORD_TOKEN: 'Invalid forgot password token',
  RESET_PASSWORD_SUCCESS: 'Reset password success',
  GET_ME_SUCCESS: 'Get my profile success',
  USER_NOT_VERIFIED: 'User not verified',
  BIO_MUST_BE_STRING: 'Bio must be a string',
  BIO_LENGTH: 'Bio length must be from 1 to 200',
  LOCATION_MUST_BE_STRING: 'Location must be a string',
  LOCATION_LENGTH: 'Location length must be from 1 to 200',
  WEBSITE_MUST_BE_STRING: 'Website must be a string',
  WEBSITE_LENGTH: 'Website length must be from 1 to 200',
  USERNAME_MUST_BE_STRING: 'Username must be a string',
  USERNAME_INVALID:
    'Username must be 4-22 characters long and contain only letters, numbers, underscores, not only numbers',
  USERNAME_LENGTH: 'Username length must be from 1 to 50',
  IMAGE_URL_MUST_BE_STRING: 'Avatar must be a string',
  IMAGE_URL_LENGTH: 'Avatar length must be from 0 to 400',
  UPDATE_ME_SUCCESS: 'Update my profile success',
  GET_PROFILE_SUCCESS: 'Get profile success',
  FOLLOW_SUCCESS: 'Follow success',
  INVALID_USER_ID: 'Invalid user id',
  FOLLOWED: 'Followed',
  INVALID_FOLLOW_USER_ID: 'Invalid followed user id',
  ALREADY_UNFOLLOWED: 'Already unfollowed',
  UNFOLLOW_SUCCESS: 'Unfollow success',
  USERNAME_EXISTED: 'Username existed',
  OLD_PASSWORD_NOT_MATCH: 'Old password not match',
  CHANGE_PASSWORD_SUCCESS: 'Change password success',
  GMAIL_NOT_VERIFIED: 'Gmail not verified',
  UPLOAD_SUCCESS: 'Upload success',
  REFRESH_TOKEN_SUCCESS: 'Refresh token success',
  GET_VIDEO_STATUS_SUCCESS: 'Get video status success',
  USER_SEARCH_SUCCESS: 'Search user Successfully'
}

export const TWEETS_MESSAGES = {
  INVALID_TYPE: 'Invalid type',
  INVALID_AUDIENCE: 'Invalid audience',
  PARENT_ID_MUST_BE_A_VALID_TWEET_ID: 'Parent id must be a valid tweet id',
  PARENT_ID_MUST_BE_NULL: 'Parent id must be null',
  CONTENT_MUST_BE_A_NON_EMPTY_STRING: 'Content must be a non-empty string',
  CONTENT_MUST_BE_EMPTY_STRING: 'Content must be empty string',
  HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING: 'Hashtags must be an array of string',
  MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID: 'Mentions must be an array of user id',
  MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT: 'Medias must be an array of media object',
  INVALID_TWEET_ID: 'Invalid tweet id',
  TWEET_NOT_FOUND: 'Tweet not found',
  TWEET_IS_NOT_PUBLIC: 'Tweet is not public',
  TWEET_CREATE_SUCCESS: 'Create tweet successfully!',
  TWEET_GET_SUCCESS: 'Get tweet successfully!',
  TWEET_DELETE_SUCCESS: 'Delete tweet successfully!',
  TWEET_CHILDREN_GET_SUCCESS: 'Get tweet children successfully!',
  TWEET_NEW_FEED_GET_SUCCESS: 'Get New Feeds Successfully',
  TWEET_SEARCH_SUCCESS: 'Search tweet Successfully'
} as const
export const BOOKMARK_MESSAGES = {
  BOOKMARK_SUCCESSFULLY: 'Bookmark successfully',
  UNBOOKMARK_SUCCESSFULLY: 'Unbookmark successfully'
} as const
export const LIKE_MESSAGES = {
  LIKE_SUCCESSFULLY: 'Like successfully',
  UNLIKE_SUCCESSFULLY: 'UnLike successfully'
} as const

export const SEARCH_MESSAGES = {
  SEARCH_CONTENT_IS_STRING: 'Content must be string',
  SEARCH_NAME_IS_STRING: 'Content must be string',
  SEARCH_PEOPLE_FOLLOW_ON_OR_OFF: 'People follow must be on or off'
} as const

export const CONVERSATION_MESSAGES = {
  GET_CONVERSATION: 'Get conversation successfully'
} as const

export const CHAT_MESSAGES = {
  CHAT_CREATE_SUCCESS: 'Create chat successfully!',
  GET_USER_CHAT_SUCCESS: 'Get user chat successfully!',
  FIND_CHAT_SUCCESS: 'Find chat successfully!'
}
export const NOTIFY_MESSAGES = {
  GET_USER_CHAT_SUCCESS: 'Get notifications successfully!',
}

export const COMMENT_MESSAGES = {
  CREATE_COMMENT_SUCCESS: 'Create comment successfully!',
  GET_COMMENT_SUCCESS: 'Get list comments successfully!',
  DELETE_COMMENT_SUCCESS: 'Delete comments successfully!',
  UPDATE_COMMENT_SUCCESS: 'Update comments successfully!',
  GET_USER_COMMENT_SUCCESS: 'Get user comment successfully!',
  FIND_COMMENT_SUCCESS: 'Find comment successfully!'
}

export const STORY_MESSAGES = {
  CREATE_STORY_SUCCESS: 'Create story successfully!',
  GET_STORY_SUCCESS: 'Get list stories successfully!',
  DELETE_STORY_SUCCESS: 'Delete story successfully!',
  UPDATE_STORY_SUCCESS: 'Update story successfully!',
  GET_USER_STORY_SUCCESS: 'Get user story successfully!',
  FIND_STORY_SUCCESS: 'Find story successfully!'
}

export const COMMON_MESSAGE = {
  NOT_FOUND: 'Not found!'
}