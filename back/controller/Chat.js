const Chat = require('../models/Chat')

exports.startChat = async (req, res) => {
    try{

        const { receiverId } = req.body
        const senderId = req.user.id

        let chat = await Chat.findOne({
            participants: { $all: [senderId, receiverId], $size: 2 }
        })

        if(!chat){
            chat = await Chat.create({ participants: [senderId, receiverId] })
        }
        
        res.status(200).json({message: 'chat started successfuly', chat})

    }catch(err){
        res.status(500).json({message: 'error creating chat'})
    }
}

exports.getChatId = async (req, res) => {
    try{

        const { conversationId } = req.params
        const userId = req.user.id

        const chat = await Chat.findById(conversationId).populate('participants', 'name lastname avatarUrl status')
        if(!chat) return res.status(404).json({ message: 'Chat not found' })

        const otherUser = chat.participants.find(p => p._id.toString() !== userId)

        res.status(200).json({chat, otherUser})

    }catch(err){
        res.status(500).json({message: 'error getting chat by id', error: err.message})
    }
}

exports.deleteChat = async (req, res) => {
    try{

        const { chatId } = req.params

        const chat = await Chat.findByIdAndDelete(conversationId)
        res.status(200).json({message: 'chat deleted successfuly', chat})

    }catch(err){
        res.status(500).json({message: 'error deleting chat'})
    }
}