const Message = require('../models/Message')
const Conversation = require('../models/Conversation')

const { createMessage, editMessage, removeMessage } = require('../services/message.service')
const { formatMessage } = require('../utils/formatMessage')

exports.getMessages = async (req, res) => {
    try{

        const conversationId = req.params.id
        const userId = req.user.id

        const conversation = await Conversation.findById(conversationId)
        if(!conversation){
            return res.status(404).json({message: 'Conversation not found'})
        }

        const checkParticipants = conversation.participants.some(p => p.toString() === userId)
        if(!checkParticipants){
            return res.status(403).json({message: 'You are not part of the chat'})
        }

        const messages = await Message.find({ conversationId: conversationId, isDeleted: false })
            .sort({ createdAt: 1 })
            .populate('sender', 'username avatar')

        res.status(200).json({
            message: 'messages received successfully',
            messages: messages.map(formatMessage)
        })

    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}

exports.sendMessage = async (req, res) => {
    try{

        const conversationId = req.params.id
        const { content, type } = req.body
        const userId = req.user.id

        const conversation = await Conversation.findById(conversationId)
        if(!conversation){
            return res.status(404).json({message: 'Conversation not found'})
        }

        const isSenderParticipant = conversation.participants.some(p => p.toString() === userId)
        if(!isSenderParticipant){
            return res.status(403).json({message: 'You are not part of the chat'})
        }

        if(!content || content.length === 0 ){
            return res.status(400).json({message: 'text must be at least one simbol'})
        }

        const message = await createMessage({
            conversationId,
            type,
            senderId: userId,
            content
        })

        const io = req.app.get('io')
        const formattedMessage = formatMessage(message)

        io.to(conversationId).emit('new_message', formattedMessage)

        res.status(201).json({
            message: 'message sent successfully',
            sentMessage: formattedMessage
        })


    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}

exports.deleteMessage = async (req, res) => {
    try{

        const messageId = req.params.id
        const userId = req.user.id

        const message = await Message.findById(messageId)
        if(!message){
            return res.status(404).json({message: 'Message not found'})
        }

        const sender = message.sender.toString() === userId
        if(!sender){
            return res.status(403).json({message: 'only sender can delete the message'})
        }

        if(message.isDeleted === true){
            return res.status(400).json({message: 'message is already removed'})
        }

        await removeMessage({
            messageId
        })

        res.status(200).json({message: 'message removed'})


    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}

exports.markAsRead = async (req, res) => {
    try{

        const conversationId = req.params.id
        const userId = req.user.id

        const conversation = await Conversation.findById(conversationId)
        if(!conversation){
            return res.status(404).json({message: 'Conversation not found'})
        }

        const checkParticipants = conversation.participants.some(p => p.toString() === userId)
        if(!checkParticipants){
            return res.status(403).json({message: 'You are not part of the chat'})
        }

        await Message.updateMany(
            { 
                conversationId, 
                sender: { $ne: userId },
                readBy: { $nin: [userId] }
            },
            { $addToSet: { readBy: userId } }
        )
        res.status(200).json({ message: 'messages marked as read' })

    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}

exports.editMessage = async (req, res) => {
    try{

        const messageId = req.params.id
        const { content } = req.body
        const userId = req.user.id

        const message = await Message.findById(messageId)
        if(!message){
            return res.status(404).json({message: 'message not found'})
        }

        if(message.sender.toString() !== userId){
            return res.status(403).json({message: 'only sender can edit this message'})
        }

        if(message.isDeleted === true){
            return res.status(400).json({message: 'message is already removed'})
        }

        if(!content || content.length === 0){
            return res.status(400).json({message: 'message must not be empty'})
        }

        const updated = await editMessage({
            messageId,
            content
        })

        res.status(200).json({
            message: 'message updated successfully',
            updatedMessage: formatMessage(updated)
        })
        
    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}
