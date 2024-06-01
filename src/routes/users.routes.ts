import { UpdateMeReqBody } from '~/models/request/User.requests'
import wrapRequestHandler from '~/utils/handlers'
import { Router } from 'express'
import {
  changePasswordController,
  findEmailController,
  followController,
  forgotPasswordController,
  forgotPasswordOTPController,
  getMeController,
  getProfileController,
  getProfileIdController,
  getUsersFollowingController,
  loginController,
  logoutController,
  oAuthController,
  refreshTokenController,
  registerController,
  resendPasswordOTPController,
  resendVerifyEmailController,
  resetPasswordController,
  resetPasswordOTPController,
  unfollowController,
  updateMeController,
  verifyEmailTokenController,
  verifyForgotPasswordController,
  verifyOTPController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  changePasswordValidator,
  findEmailValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordOTPValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyEmailTokenValidator,
  verifyForgotForgotPasswordTokenValidator,
  verifyOTPValidator
} from '~/middlewares/users.middlewares'
import { filterMiddleWare } from '~/middlewares/common.middleware'

const usersRouter = Router()

/**
 * Description. Login a user
 * Path: /login
 * Method: POST
 * Body: { email: string, password: string }
 */
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
/**
 * Description. OAuth with google
 * Path: /
 * Method: GET
 * Query: {code: string}
 */
usersRouter.get('/oauth/google', oAuthController)
/**
 * Description. Register a new user
 * Path: /register
 * Method: POST
 * Body: { name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601 }
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
/**
 * Description. Logout a user
 * Path: /logout
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { refresh_token: string }
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
/**
 * Description. refresh-token
 * Path: /refresh-token
 * Method: POST
 * Body: { refresh_token: string }
 */
usersRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

/**
 * Description. Verify email when user client click on the link in email
 * Path: /verify-email
 * Method: POST
 * Body: { email_verify-token: string }
 */
usersRouter.post('/verify-email', verifyEmailTokenValidator, wrapRequestHandler(verifyEmailTokenController))

/**
 * Description. Resend verify email when user client click on the link in email
 * Path: /resend-verify-email
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { }
 */
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController))

/**
 * Description. Check email in database
 * Path: /find-email
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: { email: string }
 */
usersRouter.post('/find-email', findEmailValidator, wrapRequestHandler(findEmailController))

/**
 * Description. submit email to reset password, send email to user
 * Path: /forgot-password
 * Method: POST
 * Body: { email: string }
 */
// usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordOTPController))
/**
 * Description. check OTP
 * Path: /verify-forgot-password-token
 * Method: POST
 * Body: {OTP: string}
 */

usersRouter.post('/verify-otp', verifyOTPValidator, wrapRequestHandler(verifyOTPController))

/**
 * Description. verify password token
 * Path: /verify-forgot-password-token
 * Method: POST
 * Body: {forgot_password_token: string}
 */
usersRouter.post(
  '/verify-forgot-password-token',
  verifyForgotForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)

/**
 * Description. change password
 * Path: /reset-password
 * Method: POST
 * Body: {forgot_password_token: string, password: string, confirm_password: string}
 */
// usersRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))
/**
 * Description. change password
 * Path: /reset-password
 * Method: POST
 * Body: {password: string, confirm_password: string}
 * Headers: {Authorization: Bearer <otp_token>}
 */
usersRouter.post('/reset-password', resetPasswordOTPValidator, wrapRequestHandler(resetPasswordOTPController))

/**
 * Description: resend OTP
 * Path: "/resend-otp"
 * Method: POST
 * body:{}
 * headers: {Authorization: Bearer <jwtToken>}
 */
usersRouter.post('/resend-otp', verifyOTPValidator, wrapRequestHandler(resendPasswordOTPController))
/**
 * Description. get me
 * Path: /me
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

/**
 * Description. update my profile of user
 * Path: /me
 * Method: PATCH (update to field)
 */
usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleWare<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  wrapRequestHandler(updateMeController)
)
/**
 * Description. Get user profle
 * Path: /:username
 * Method: GET
 */
usersRouter.get('/:username', wrapRequestHandler(getProfileController))
usersRouter.get('/v1/:userId', wrapRequestHandler(getProfileIdController))

/**
 * Description. Follow someone
 * Path: /follow
 * Method: POST
 * Body: {user_id: string, followed_user_id: string}
 * Header: { Authorization: Bearer <access_token> }
 */
usersRouter.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
)
/**
 * Description. unFollow someone
 * Path: /follow/user_id
 * Method: DELETE
 * Body: { followed_user_id: string}
 * Header: { Authorization: Bearer <access_token> }
 */
usersRouter.delete(
  '/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequestHandler(unfollowController)
)

usersRouter.get(
  '/v1/follow',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequestHandler(getUsersFollowingController)
)
/**
 * Description. get users following
 * Path: /v1/follow
 * Method: GET
 * Body: {}
 * Header: {Authorization: Bear <access_token>}
 */

/**
 * Description. change password
 * Path: /change-password
 * Method: PUT
 * Body: { old_password: string, password: string, confirm_password: string}
 * Header: { Authorization: Bearer <access_token> }
 */
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)
export default usersRouter
