import { Socket } from "socket.io"
import { UserVerifyStatus } from "~/constants/enum"
import HTTP_STATUS from "~/constants/httpStatus"
import { USERS_MESSAGES } from "~/constants/message"
import { ErrorWithStatus } from "~/models/Errors"
import { TokenPayload } from "~/models/request/User.requests"
import { verifyAccessToken } from "~/utils/common"

interface Error {
    name: string;
    message: string;
    stack?: string;
}
const users: { [key: string]: { socket_id: string } } = {}

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
    const { Authorization } = socket.handshake.auth
    const access_token = Authorization?.split(' ')[1]
    try {
        const decoded_authorization = await verifyAccessToken(access_token)
        const { verify } = decoded_authorization as TokenPayload
        if (verify !== UserVerifyStatus.Verified) {
            throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_VERIFIED,
                status: HTTP_STATUS.FORBIDDEN
            })
        }
        // pass decoded_authorization to global socket
        socket.data.user = decoded_authorization
        next()
    } catch (error) {
        const err = new Error('Unauthorized')
        err.name = 'UnauthorizedError'
        // @ts-ignore
        err.data = error

        next(err)
    }
}