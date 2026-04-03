const Conversation = require('../models/Conversation')

exports.getMyConversations = async (req, res) => {
    try{

        const conversations = await Conversation.find({ participants: req.user.id })
            .sort({ updatedAt: -1 })
            .populate("participants", "username avatar isOnline")
        res.status(200).json({message: 'conversations fetched successfully', conversations})

    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}

exports.getConversationById = async (req, res) => {
    try{

        const conversationId = req.params.id

        const conversation = await Conversation.findById(conversationId)
            .populate("participants", "username avatar isOnline")
        if(!conversation){
            return res.status(404).json({message: 'conversation not found'})
        }

        res.status(200).json({message: 'conversation fetched successfully', conversation})

    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}

exports.createConversation = async (req, res) => {
    try{

        const { participants, groupName } = req.body
        const userId = req.user.id

        if(!participants || participants.length !== 2){
            return res.status(400).json({message: 'participants are requried'})
        }

        const existing = await Conversation.findOne({
            isGroup: false,
            participants: { $all: [userId, participants[0]] }
        })
        if (existing) return res.status(200).json({ conversation: existing })

        const conversation = await Conversation.create({
            participants,
            groupName
        })

        res.status(201).json({message: 'Conversation created successfully', conversation})

    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}

exports.createGroupConversations = async (req, res) => {
    try{

        const { name, participantIds } = req.body
        const userId = req.user.id

        if (!participantIds || participantIds.length < 2) {
            return res.status(400).json({ message: 'A group needs at least 2 other participants' })
        }

        const allParticipants = [...new Set([participantIds, userId])]

        const conversation = await Conversation.create({
            participants: allParticipants,
            isGroup: true,
            groupName: name,
            groupAdmin: userId
        })

        const populated = await conversation.populate('participants', 'username avatar isOnline')

        res.status(201).json({ message: 'Group created successfully', conversation: populated })


    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}

exports.addParticipant = async (req, res) => {
    try{

        const conversationId = req.params.id
        const { userId } = req.body

        const conversation = await Conversation.findById(conversationId)
        if(!conversation){
            return res.status(404).json({message: 'conversation not found'})
        }

        if(!conversation.isGroup){
            return res.status(400).json({ message: 'Cannot add participants to a direct message' })
        }

        if (conversation.groupAdmin.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the group admin can add participants' })
        }

        const alreadyIn = conversation.participants.some(p => p.toString() === userId)
        if(alreadyIn) {
            return res.status(400).json({ message: 'User is already in this group' })
        }

        conversation.participants.push(userId)
        await conversation.save()

        const populated = await conversation.populate('participants', 'username avatar isOnline')

        res.status(200).json({ message: 'Participant added', conversation: populated })



    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}

exports.leaveConversation = async (req, res) => {
    try{

        const conversationId = req.params.id
        const userId = req.user.id

        const conversation = await Conversation.findById(conversationId)
        if(!conversation){
            return res.status(404).json({message: "Chat not found"})
        }

        if(!conversation.participants.some(p => p.toString() === userId)){
            return res.status(403).json({message: 'User doesnot not exists in this chat'})
        }

        if(conversation.groupAdmin === userId){
            await Conversation.findByIdAndDelete(conversationId)
            res.status(200).json({message: 'Group removed'})
        }else{
            await Conversation.findByIdAndUpdate(conversationId, { $pull: { participants: userId }  })
            res.status(200).json({message: 'Leaved group successfuly'})
        }


    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}