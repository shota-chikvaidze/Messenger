const Message = require('./models/Message')
const Chat = require('./models/Chat')
const onlineUsers = new Map()

function initSocket(io) {

    io.on('connection', (socket) => {

        socket.on('user-online', (userId) => {
            if(!onlineUsers.has(userId)){
                onlineUsers.set(userId, new Set())
            }
            onlineUsers.get(userId).add(socket.id)

            socket.emit('online-users', Array.from(onlineUsers.keys()))
        })

        socket.on('disconnect', () => {
            for (let [userId, sockets] of onlineUsers.entries()){
                sockets.delete(socket.id)
                if(sockets.size === 0) onlineUsers.delete(userId)
            }
            socket.emit('online-users', Array.from(onlineUsers.keys()))
        })

        socket.on('joinRoom', (chatId) => {
            socket.join(chatId)
        })

        socket.on("leaveChat", (chatId) => {
            socket.leave(chatId);
        });
        

socket.on('sendMessage', async ({ chatId, senderId, receiverId, content, tempId }) => {
  try {


const message = await Message.create({ chatId, sender: senderId, receiver: receiverId, content });

await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      updatedAt: Date.now(),
    });

const populatedMessage = await Message.findById(message._id)
  .populate('sender', 'name lastname _id avatarUrl')
  .populate('receiver', 'name lastname _id avatarUrl');

io.to(chatId).emit('receiveMessage', { ...populatedMessage.toObject(), tempId });

    

  } catch (err) {
    console.error('error sending message', err);
  }
});


        socket.on('deleteMessage', async ({ messageId, userId }) => {

            try{

                const deletedMessage = await Message.findOneAndUpdate(
                    { _id: messageId, sender: userId },
                    { content: 'This message was deleted', deleted: true },
                    { new: true }
                )

                if(!deletedMessage) return

                io.to(deletedMessage.chatId.toString()).emit('messageDeleted', {
                    messageId: deletedMessage._id,
                    userId
                })

            }catch(err){
                console.error('error', err)
            }

        })

        socket.on('editMessage', async ({ messageId, newText, userId }) => {

            try{
                
                const editedMessage = await Message.findOneAndUpdate(
                    { _id: messageId, sender: userId },
                    { content: newText, edited: true },
                    { new: true }
                )

                if (!editedMessage) return;

    const populatedMessage = await Message.findById(editedMessage._id)
      .populate('sender', 'name lastname _id avatarUrl')
      .populate('receiver', 'name lastname _id avatarUrl');

                io.to(editedMessage.chatId.toString()).emit('messageEdited', populatedMessage)

            }catch(err){

            }

        })

        socket.on('typing', ({chatId, userId}) => {
            socket.to(chatId).emit('typing', {userId})
        })
        socket.on('stop-typing', ({chatId, userId}) => {
            socket.to(chatId).emit('stop-typing', {userId})
        })

    })

}

module.exports = initSocket