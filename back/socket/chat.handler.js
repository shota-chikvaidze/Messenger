const { createMessage, editMessage, removeMessage } = require('../services/message.service')
const EVENTS = require('../constants/events')

exports.registerChatHandlers = (io, socket) => {

    socket.on(EVENTS.SEND_MESSAGE, async (data) => {
        
        const { conversationId, content, type } = data
        const message = await createMessage({
            conversationId,
            content,
            type,
            senderId: socket.user.id
        })

        io.to(conversationId).emit(EVENTS.NEW_MESSAGE, message)

    })

    socket.on(EVENTS.REMOVE_MESSAGES, async (data) => {
        
        const { messageId, conversationId } = data
        const message = await removeMessage({
            messageId
        })

        io.to(conversationId).emit(EVENTS.REMOVE_MESSAGES, message)

    })

    socket.on(EVENTS.EDIT_MESSAGES, async (data) => {
        
        const { messageId, content, conversationId } = data
        const message = await editMessage({
            messageId,
            content
        })

        io.to(conversationId).emit(EVENTS.EDIT_MESSAGES, message)

    })

    socket.on(EVENTS.TYPING_START, (data) => {
        socket.to(data.conversationId).emit(EVENTS.TYPING_START, {
            userId: socket.user.id,
            conversationId: data.conversationId
        })
    })

    socket.on(EVENTS.TYPING_STOP, (data) => {
        socket.to(data.conversationId).emit(EVENTS.TYPING_STOP, {
            userId: socket.user.id,
            conversationId: data.conversationId
        })
    })

}