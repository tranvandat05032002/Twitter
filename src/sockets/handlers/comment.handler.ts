import { Server, Socket } from 'socket.io'

export const registerCommentHandlers = (io: Server, socket: Socket) => {
    socket.on('send_comment', (comment) => {
        socket.broadcast.emit('receiver_comment', comment)
    })
}