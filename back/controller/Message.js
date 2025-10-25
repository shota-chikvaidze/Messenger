const express = require('express')
const Message = require('../models/Message')
const Chat = require('../models/Chat')

exports.sendMessage = async (req, res) => {
    try{

        const { chatId, content, receiverId } = req.body
        const senderId = req.user.id

        const message = await Message.create({ 
            chatId,
            content,
            receiver: receiverId,
            sender: senderId
        })

        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: message._id,
            updatedAt: Date.now()
        })

        res.status(201).json({message})

    }catch(err){
        res.status(500).json({ message: 'error sending message', error: err.message })
    }
}

exports.getMessages = async (req, res) => {
    try{
        
        const { conversationId } = req.params
       

        const message = await Message.find({ chatId: conversationId })
            .sort({ createdAt: -1 })
            .populate('sender', 'name lastname avatarUrl')
            .populate('receiver', 'name lastname avatarUrl')

        res.status(200).json(message.reverse())

    }catch(err){
        res.status(500).json({ message: 'error getting message', error: err.message })
    }
}

exports.markAsRead = async (req, res) => {
    try{

        const { chatId } = req.body
        const userId = req.user.id

        await Message.updateMany(
          { chatId, sender: { $ne: userId }, read: false },
          { $set: { read: true } }
        )

        res.status(200).json({ message: 'Messages marked as read' })
    
    }catch(err){
        res.status(500).json({ message: 'error marking message as read', error: err.message })
    }
}

exports.attachments = async (req, res) => {
    try{

        const { chatId, receiver, content } = req.body
        const senderId = req.user.id

        const attachments = req.files.map(file => ({
            filename: file.filename,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size
        }))

        const message = new Message({
            chatId,
            sender: senderId,
            receiver,
            content,
            attachments
        })

        await message.findByIdAndUpdate(chatId, {
            lastMessage: message._id,
            updatedAt: Date.now()
        })

        res.status(201).json(message)

    }catch(err){
        res.status(500).json({message: 'attachments error', error: err.message})
    }
}