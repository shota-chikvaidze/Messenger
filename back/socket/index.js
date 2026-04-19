const { verifyToken } = require('../utils/token')
const { registerChatHandlers } = require('./chat.handler')
const { registerPresenceHandlers } = require('./presence.handler')

const getCookie = (cookieHeader, name) => {
    if (!cookieHeader) return null

    const cookies = cookieHeader.split(';').map(cookie => cookie.trim())
    const cookie = cookies.find(cookie => cookie.startsWith(`${name}=`))

    return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null
}

module.exports = (io) => {
    
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || getCookie(socket.handshake.headers.cookie, 'accessToken')
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
