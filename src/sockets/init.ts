//Init socket server
import { Server as ServerHttp } from 'http'
import { Server } from 'socket.io'
import { envConfig } from '~/constants/config'
import { socketAuthMiddleware } from '~/middlewares/socket.middleware'
import { registerCallHandlers } from './handlers/call.handler'
import { registerCommentHandlers } from './handlers/comment.handler'
import { registerMessageHandlers } from './handlers/message.handler'
import { registerNotifyHandlers } from './handlers/notify.handler'
import { registerUserHandlers } from './handlers/user.handler'

const activeUsers = new Map<string, string>()

const initSocket = (httpServer: ServerHttp) => {
    const io = new Server(httpServer, {
        cors: {
            origin: envConfig.clientUrl
        }
    })

    io.use(socketAuthMiddleware)

    io.on('connection', (socket) => {
        registerUserHandlers(io, socket, activeUsers)
        registerMessageHandlers(io, socket)
        registerCommentHandlers(io, socket)
        registerNotifyHandlers(io, socket, activeUsers)
        registerCallHandlers(io, socket)
    })
}

export default initSocket