import { Server, Socket } from "socket.io"

export const registerCallHandlers = (io: Server, socket: Socket) => {
    const userId = socket.data.user.user_id.toString()

    socket.on('call-user', ({ toUserId, offer }) => {
        io.to(toUserId).emit('call-made', {
            from: userId,
            offer
        })
    })

    socket.on('make-answer', ({ toUserId, answer }) => {
        io.to(toUserId).emit('answer-made', {
            from: userId,
            answer
        })
    })

    socket.on('ice-candidate', ({ toUserId, candidate }) => {
        io.to(toUserId).emit('ice-candidate', {
            from: userId,
            candidate
        })
    })

    socket.on('call-rejected', ({ toUserId }) => {
        io.to(toUserId).emit('call-rejected', { from: userId })
    })

    socket.on('call-ended', ({ toUserId }) => {
        io.to(toUserId).emit('call-ended', { from: userId })
    })
} 