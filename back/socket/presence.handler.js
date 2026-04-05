const User = require('../models/User')
const Conversation = require('../models/Conversation')

exports.registerPresenceHandlers = async (io, socket) => {
    
    const joinRooms = async () => {
        const conversations = await Conversation.find({
            participants: socket.user.id
        })
        conversations.forEach(c => socket.join(c._id.toString()))

        await User.findByIdAndUpdate(socket.user.id, { isOnline: true })
        socket.broadcast.emit('user_online', { userId: socket.user.id })
    }

    joinRooms()

    socket.on('disconnect', async () => {
        await User.findByIdAndUpdate(socket.user.id, { 
            isOnline: false, 
            lastSeen: new Date()  
        })
        
        socket.broadcast.emit('user_offline', { 
            userId: socket.user.id, 
            lastSeen: new Date() 
        })
    })

}