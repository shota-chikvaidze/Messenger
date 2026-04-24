const User = require('../models/User')
const Conversation = require('../models/Conversation')

const activeUserSockets = new Map()

exports.registerPresenceHandlers = async (io, socket) => {
    
    const joinRooms = async () => {
        const conversations = await Conversation.find({
            participants: socket.user.id
        })
        conversations.forEach(c => socket.join(c._id.toString()))

        const userId = socket.user.id
        const connectionCount = activeUserSockets.get(userId) || 0
        activeUserSockets.set(userId, connectionCount + 1)

        if (connectionCount === 0) {
            await User.findByIdAndUpdate(userId, { isOnline: true })
            socket.broadcast.emit('user_online', { userId })
        }
    }

    joinRooms()

    socket.on('disconnect', async () => {
        const userId = socket.user.id
        const connectionCount = activeUserSockets.get(userId) || 0
        const nextConnectionCount = Math.max(connectionCount - 1, 0)

        if (nextConnectionCount > 0) {
            activeUserSockets.set(userId, nextConnectionCount)
            return
        }

        activeUserSockets.delete(userId)

        const lastSeen = new Date()

        await User.findByIdAndUpdate(userId, { 
            isOnline: false, 
            lastSeen  
        })
        
        socket.broadcast.emit('user_offline', { 
            userId, 
            lastSeen 
        })
    })

}
