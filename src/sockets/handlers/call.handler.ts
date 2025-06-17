import { Server, Socket } from "socket.io"

export const registerCallHandlers = (io: Server, socket: Socket) => {
    const userId = socket.data.user.user_id.toString()

    // Khi có người gọi
    socket.on('call-user', ({ userrToCall, signalData, from }) => {
        console.log("userrToCall ---> ", userrToCall)
        console.log("signalData ---> ", signalData)
        console.log("from ---> ", from)
        io.to(userrToCall).emit('call-made', {
            signal: signalData,
            from,
        })
    })

    // Khi người nhận trả lời
    socket.on('answer-call', ({ to, signal }) => {
        io.to(to).emit('call-accepted', {
            signal
        })
    })

    // Trao đổi ICE candidates
    socket.on('ice-candidate', ({ to, candidate }) => {
        io.to(to).emit('ice-candidate', {
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