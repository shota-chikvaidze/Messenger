const { verifyToken } = require('../utils/token')
const { registerChatHandlers } = require('./chat.handler')
const { registerPresenceHandlers } = require('./presence.handler')

module.exports = (io) => {
    
    io.use((socket, next) => {
        const token = socket.handshake.auth.token
        if(!token) return next(new Error('Authentication error'))

        const decoded = verifyToken(token)
        if (!decoded) return next(new Error('Authentication error'))
        
        socket.user = decoded
        next()
    })

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.id}`)

        registerChatHandlers(io, socket)
        registerPresenceHandlers(io, socket)

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.id}`)
        })

    })

}