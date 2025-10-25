const express = require('express')
const FriendRequest = require('../models/FriendRequest')
const User = require('../models/User')

exports.sendRequest = async (req, res) => {
    try{

        const { receiverId } = req.body
        const senderId = req.user.id

        const findRequest = await FriendRequest.findOne({ sender: senderId, receiver: receiverId})
        if(findRequest){
            return res.status(401).json({message: 'request already sent'})
        }

        const createRequest = await FriendRequest.create({ sender: senderId, receiver: receiverId, status: 'pending'  })
        res.status(201).json({message: 'send request created successfuly', createRequest})

    }catch(err){
        res.status(500).json({message: 'error sending friend request', error: err.message})
    }
}

exports.acceptRequest = async (req, res) => {
    try{

        const { requestId } = req.body

        const request = await FriendRequest.findById(requestId)
        if(!request){
            return res.status(401).json({message: 'request not found'})
        }

        const senderId = request.sender
        const receiverId = request.receiver

        await User.findByIdAndUpdate(senderId, {
            $addToSet: { friends: receiverId }
        })

        await User.findByIdAndUpdate(receiverId, {
            $addToSet: { friends: senderId }
        })

        await FriendRequest.findByIdAndDelete(requestId);


        res.status(200).json({message: 'friend accepted successfuly'})

    }catch(err){
        res.status(500).json({message: 'error accepting friend request', error: err.message})
    }
}

exports.declineRequest = async (req, res) => {
    try{

        const { requestId } = req.body
        
        const request = await FriendRequest.findById(requestId)
        if(!request){
            return res.status(401).json({message: 'request not found'})
        }

        await FriendRequest.findByIdAndDelete(requestId)

        res.status(200).json({message: 'friend request deleted successfuly'})

    }catch(err){
        res.status(500).json({message: 'error rejecting friend request', error: err.message})
    }
}

exports.getRequest = async (req, res) => {
    try{

        const userId = req.user.id

        const pending = await FriendRequest.find({ receiver: userId, status: 'pending' })
            .populate('sender', 'name lastname avatarUrl')

        res.status(200).json(pending)

    }catch(err){
        res.status(500).json({message: 'error getting friend request', error: err.message})
    }
}

exports.blockUser = async (req, res) => {
    try{

        const { userIdToBlock } = req.body
        const currentUserId = req.user.id

        if(userIdToBlock === currentUserId){
            return res.status(400).json({message: 'error you cant block yourself'})
        }

        const currentUser = await User.findById(currentUserId)
        if(!currentUser.blockedUsers.includes(userIdToBlock)){
            currentUser.blockedUsers.push(userIdToBlock)
            await currentUser.save()
        }

        res.status(200).json({message: 'user blocked successfuly'})

    }catch(err){
        res.status(500).json({message: 'error blocking user'})
    }
}


exports.unblockUser = async (req, res) => {
    try{

        const { userIdToUnblock } = req.body
        const currentUserId = req.user.id

        const currentUser = await User.findById(currentUserId)
        currentUser.blockedUsers = currentUser.blockedUsers.filter(
            id => id.toString() !== userIdToUnblock
        )
        await currentUser.save()

        res.status(200).json({message: 'user unblocked successfuly'})
        
    }catch(err){
        res.status(500).json({message: 'error unblocking user'})
    }
}

exports.userFriends = async (req, res) => {
    try{

        const user = await User.findById(req.user.id)
            .populate('friends', 'name lastname email avatarUrl status')


        res.status(200).json({message: 'friends fetched successfuly', friends: user.friends })

    }catch(err){
        res.status(500).json({message: 'error fetching user friends'})
    }
}

exports.searchUsers = async (req, res) => {
    try{

        const { query } = req.query
        const currentUserId = req.user.id

        const users = await User.find({
            _id: { $ne: currentUserId },
            $or: [
                { lastname: { $regex: query, $options: "i" } },
                { name: { $regex: query, $options: "i" } }
            ]
        }).select('lastname name')

        res.status(200).json({ users })

    }catch(err){
        res.status(500).json({message: 'error fetching users'})
    }
}