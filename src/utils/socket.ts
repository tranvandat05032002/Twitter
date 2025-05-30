import { Server } from 'socket.io'
import databaseService from '~/services/database.services'
import { verifyAccessToken } from './common'
import { TokenPayload } from '~/models/request/User.requests'
import { UserVerifyStatus } from '~/constants/enum'
import { ErrorWithStatus } from '~/models/Errors'
import { USERS_MESSAGES } from '~/constants/message'
import HTTP_STATUS from '~/constants/httpStatus'
import Conversation from '~/models/schemas/Conversation'
import { ObjectId } from 'mongodb'
import { Server as ServerHttp } from 'http'
import { envConfig } from '~/constants/config'
// Socket of conversation course DuThanhDuoc

// const initSocket = (httpServer: ServerHttp) => {
// const io = new Server(httpServer, {
//   cors: {
//     origin: envConfig.clientUrl
//   }
// })
// interface IConversation {
//   payload: {
//     sender_id: string
//     receiver_id: string
//     content: string
//   }
// }
// const users: {
//   [key: string]: { socket_id: string }
// } = {}
//   // socket middleware check user verify
// io.use(async (socket, next) => {
//   const { Authorization } = socket.handshake.auth
//   const access_token = Authorization?.split(' ')[1]
//   try {
//     const decoded_authorization = await verifyAccessToken(access_token)
//     const { verify } = decoded_authorization as TokenPayload
//     if (verify !== UserVerifyStatus.Verified) {
//       throw new ErrorWithStatus({
//         message: USERS_MESSAGES.USER_NOT_VERIFIED,
//         status: HTTP_STATUS.FORBIDDEN
//       })
//     }
//     // pass decoded_authorization to global socket
//     socket.handshake.auth.access_token = access_token
//     socket.handshake.auth.decoded_authorization = decoded_authorization
//     next()
//   } catch (error) {
//     next({
//       message: 'Unauthorized',
//       name: 'UnauthorizedError',
//       data: error
//     })
//   }
// })
// io.on('connection', (socket) => {
//   console.log(`User ${socket.id} connected`)
//   const { user_id } = socket.handshake.auth.decoded_authorization as TokenPayload
//   users[user_id] = {
//     socket_id: socket.id
//   }
//   socket.use(async (packet, next) => {
//     const { access_token } = socket.handshake.auth
//     try {
//       await verifyAccessToken(access_token)
//       next()
//     } catch (error) {
//       next(new Error('Unauthorized'))
//     }
//   })
//   socket.on('error', (err) => {
//     if (err && err.message === 'Unauthorized') {
//       socket.disconnect()
//     }
//   })
//   socket.on('send_message', async (data: IConversation) => {
//     const { receiver_id, content, sender_id } = data.payload
//     const receiver_socket_id = users[receiver_id]?.socket_id
//     const conversation = new Conversation({
//       sender_id: new ObjectId(sender_id),
//       content: content,
//       receiver_id: new ObjectId(receiver_id)
//     })
//     const result = await databaseService.conversations.insertOne(conversation)
//     conversation._id = result.insertedId
//     if (receiver_socket_id) {
//       socket.to(receiver_socket_id).emit('receiver_message', {
//         payload: conversation
//       })
//     }
//   })
// socket.on('disconnect', () => {
//   delete users[user_id]
//   console.log(`User ${socket.id} disconnected`)
// })
// })
// }

// Socket of my project
const initSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    cors: {
      origin: envConfig.clientUrl
    }
  })
  interface IMessage {
    chat_id: string
    sender_id: string
    receiver_id: string
    text: string
  }
  const messageQueue: {
    [userId: string]: IMessage[]
  } = {}
  const users: {
    [key: string]: { socket_id: string }
  } = {}
  interface IActiveUser {
    userId: string
    socketId: string
  }
  let activeUsers: IActiveUser[] = []

  io.use(async (socket, next) => {
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
      socket.handshake.auth.access_token = access_token
      socket.handshake.auth.decoded_authorization = decoded_authorization
      next()
    } catch (error) {
      next({
        message: 'Unauthorized',
        name: 'UnauthorizedError',
        data: error
      })
    }
  })

  io.on('connection', (socket) => {
    const { user_id } = socket.handshake.auth.decoded_authorization as TokenPayload
    users[user_id] = {
      socket_id: socket.id
    }
    socket.use(async (packet, next) => {
      const { access_token } = socket.handshake.auth
      try {
        await verifyAccessToken(access_token)
        next()
      } catch (error) {
        next(new Error('Unauthorized'))
      }
    })
    socket.on('error', (err) => {
      if (err && err.message === 'Unauthorized') {
        socket.disconnect()
      }
    })
    // add new message
    socket.on('new_user_add', (newUserId) => {
      if (newUserId && !activeUsers.some((user) => user.userId === newUserId)) {
        activeUsers.push({
          userId: newUserId,
          socketId: socket.id
        })
      }

      users[newUserId] = { socket_id: socket.id }
      if (messageQueue[newUserId]) {
        messageQueue[newUserId].forEach((msg) => {
          io.to(socket.id).emit('receiver_message', msg)
        })
        delete messageQueue[newUserId]
      }

      io.emit('get_users', activeUsers)
    })
    // socket.on('send_message', async (data: IMessage) => {
    //   const { chat_id, text, sender_id } = data.payload
    //   const receiver_socket_id = users[receiver_id]?.socket_id
    // const conversation = new Conversation({
    //   sender_id: new ObjectId(sender_id),
    //   content: content,
    //   receiver_id: new ObjectId(receiver_id)
    // })
    //   const result = await databaseService.conversations.insertOne(conversation)
    //   conversation._id = result.insertedId
    //   if (receiver_socket_id) {
    //     socket.to(receiver_socket_id).emit('receiver_message', {
    //       payload: conversation
    //     })
    //   }
    // })

    socket.on('disconnect', () => {
      activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
      // send all active users to all users
      io.emit("get_users", activeUsers);
    })
    socket.on('send_message', async (data: IMessage) => {
      const { receiver_id, sender_id, text } = data
      // const receiver_socket_id = users[receiver_id]?.socket_id ?? receiver_id
      const conversation = new Conversation({
        sender_id: new ObjectId(sender_id),
        content: text,
        receiver_id: new ObjectId(receiver_id)
      })
      const result = await databaseService.conversations.insertOne(conversation)
      conversation._id = result.insertedId
      const receiver_socket_id = users[receiver_id]?.socket_id
      if (receiver_socket_id) {
        io.to(receiver_socket_id).emit('receiver_message', data)
      } else {
        // User offline -> push vào hàng đợi
        if (!messageQueue[receiver_id]) {
          messageQueue[receiver_id] = []
        }
        messageQueue[receiver_id].push(data)
      }
    }
    )
    socket.on('send_comment', async (comment) => {
      socket.broadcast.emit('receiver_comment', comment)
    })
  })
}

export default initSocket
