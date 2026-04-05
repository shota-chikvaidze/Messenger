const Message = require('../models/Message')
const Conversation = require('../models/Conversation')

exports.createMessage = async ({ conversationId, type = 'text', senderId, content }) => {
    
    if (!conversationId || !senderId || !content) {
        throw new Error('conversationId, senderId and content are required')
    }

    const message = await Message.create({
        conversationId,
        type,
        sender: senderId,
        content,
    })

    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        updatedAt: new Date()
    })

    return message.populate('sender', 'username avatar')
}

exports.removeMessage = async ({ messageId }) => {
    
    if (!messageId) throw new Error('messageId is required')
    
    await Message.findByIdAndUpdate(messageId, { $set: { isDeleted: true, content: '' } })
    return { messageId, isDeleted: true }

}

exports.editMessage = async ({ messageId, content }) => {
    
    if (!messageId || !content) throw new Error('messageId and content are required')

    const message = await Message.findByIdAndUpdate(
        messageId, 
        { $set: { content, isEdited: true } },
        { new: true }
    ).populate('sender', 'username avatar')
    
    return message
}