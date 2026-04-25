const Conversation = require('../models/Conversation')
const cloudinary = require('../config/cloudinary')

const formatParticipant = (participant) => ({
    id: participant._id,
    username: participant.username,
    avatar: participant.avatar,
    isOnline: participant.isOnline,
    createdAt: participant.createdAt
})

const formatConversation = (conversation) => ({
    id: conversation._id,
    participants: conversation.participants.map(formatParticipant),
    isGroup: conversation.isGroup,
    groupName: conversation.groupName,
    groupAvatar: conversation.groupAvatar,
    lastMessage: conversation.lastMessage,
    groupAdmin: conversation.groupAdmin,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
})

exports.getMyConversations = async (req, res) => {
    try{

        const conversations = await Conversation.find({ participants: req.user.id })
            .sort({ updatedAt: -1 })
            .populate("participants", "username avatar isOnline createdAt")
        res.status(200).json({
            message: 'conversations fetched successfully',
            conversations: conversations.map(formatConversation)
        })

    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}

exports.getConversationById = async (req, res) => {
    try{

        const conversationId = req.params.id
        const userId = req.user.id

        const conversation = await Conversation.findById(conversationId)
            .populate("participants", "username avatar isOnline createdAt")
        if(!conversation){
            return res.status(404).json({message: 'conversation not found'})
        }

        const isParticipant = conversation.participants.some(
            participant => participant._id.toString() === userId
        )

        if(!isParticipant) {
          return res.status(403).json({ message: 'Access denied' })
        }

        res.status(200).json({
            message: 'conversation fetched successfully',
            conversation: formatConversation(conversation)
        })

    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}

exports.createConversation = async (req, res) => {
    try {
        const { participants, groupName } = req.body
        const userId = req.user.id

        if (!participants || participants.length !== 2) {
            return res.status(400).json({ message: 'participants are required' })
        }

        const otherUserId = participants.find(id => id !== userId)

        if (!otherUserId) {
            return res.status(400).json({ message: 'invalid participants' })
        }

        const existing = await Conversation.findOne({
            isGroup: false,
            participants: { $all: [userId, otherUserId] }
        })

        if (existing) {
            const populatedExisting = await existing.populate('participants', 'username avatar isOnline')
            return res.status(200).json({
                message: 'Conversation already exists',
                conversation: formatConversation(populatedExisting)
            })
        }

        const conversation = await Conversation.create({
            participants: [userId, otherUserId],
            groupName
        })

        const populated = await conversation.populate('participants', 'username avatar isOnline')

        res.status(201).json({
            message: 'Conversation created successfully',
            conversation: formatConversation(populated)
        })

    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
}

exports.createGroupConversations = async (req, res) => {
    try{

        const { name, participantIds, groupAvatar } = req.body
        const userId = req.user.id

        if (!participantIds || participantIds.length < 2) {
            return res.status(400).json({ message: 'A group needs at least 2 other participants' })
        }

        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Group name is required' })
        }

        const allParticipants = [...new Set([...participantIds, userId])]

        const conversation = await Conversation.create({
            participants: allParticipants,
            isGroup: true,
            groupName: name.trim(),
            groupAdmin: userId,
            groupAvatar
        })

        const populated = await conversation.populate('participants', 'username avatar isOnline')

        res.status(201).json({ message: 'Group created successfully', conversation: formatConversation(populated) })


    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}

exports.addParticipant = async (req, res) => {
    try{

        const conversationId = req.params.id
        const { userId, userIds } = req.body || {}
        const participantIds = Array.isArray(userIds)
            ? userIds
            : userId
                ? [userId]
                : []

        if(participantIds.length === 0){
            return res.status(400).json({ message: 'Choose at least one participant' })
        }

        const conversation = await Conversation.findById(conversationId)
        if(!conversation){
            return res.status(404).json({message: 'conversation not found'})
        }

        if(!conversation.isGroup){
            return res.status(400).json({ message: 'Cannot add participants to a direct message' })
        }

        if(!conversation.groupAdmin && conversation.participants.some(p => p.toString() === req.user.id)){
            conversation.groupAdmin = req.user.id
        }

        if (conversation.groupAdmin?.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the group admin can add participants' })
        }

        const existingParticipantIds = conversation.participants.map(p => p.toString())
        const alreadyIn = participantIds.some(id => existingParticipantIds.includes(id))
        if(alreadyIn) {
            return res.status(400).json({ message: 'One or more users are already in this group' })
        }

        conversation.participants.push(...participantIds)
        await conversation.save()

        const populated = await conversation.populate('participants', 'username avatar isOnline createdAt')

        res.status(200).json({
            message: participantIds.length > 1 ? 'Participants added' : 'Participant added',
            conversation: formatConversation(populated)
        })


    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
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

        if(conversation.isGroup === false) {
            return res.status(400).json({message: "Cannot use leave group behavior"})
        }

        const remainingParticipants = conversation.participants.filter(
            participant => participant.toString() !== userId
        )

        if(remainingParticipants.length === 0){
            await Conversation.findByIdAndDelete(conversationId)
            return res.status(200).json({message: 'Group removed'})
        }

        conversation.participants = remainingParticipants

        if(conversation.groupAdmin?.toString() === userId) {
            conversation.groupAdmin = remainingParticipants[0]
        }

        await conversation.save()

        const populated = await conversation.populate('participants', 'username avatar isOnline createdAt')

        res.status(200).json({
            message: 'left group successfully',
            conversation: formatConversation(populated)
        })

    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}


exports.updateConversation = async (req, res) => {
    try{

        const conversationId = req.params.id
        const { groupName } = req.body

        const conversation = await Conversation.findById(conversationId)
        if(!conversation){
            return res.status(404).json({message: 'Conversation not found'})
        }

        if(!conversation.isGroup){
            return res.status(400).json({ message: 'Only group conversations can be updated' })
        }

        if(conversation.groupAdmin?.toString() !== req.user.id){
            return res.status(403).json({ message: 'Only the group admin can update this conversation' })
        }

        if(!req.file && (!groupName || !groupName.trim())) {
            return res.status(400).json({ message: 'Nothing to update' })
        }

        if(req.file && conversation.avatarPublicId){
            await cloudinary.uploader.destroy(conversation.avatarPublicId)
        }

        if(req.file){
            conversation.groupAvatar = req.file.path
            conversation.avatarPublicId = req.file.filename
        }

        if(groupName && groupName.trim()){
            conversation.groupName = groupName.trim()
        }

        await conversation.save()

        const populated = await conversation.populate('participants', 'username avatar isOnline')

        res.status(200).json({
            message: 'Conversation updated',
            conversation: formatConversation(populated)
        })

    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}
