const { request } = require('http')
const User = require('../models/User')

exports.sendFriendRequest = async (req, res) => {
    try{

        const targetUserId = req.params.id
        const userId = req.user.id

        if(targetUserId === userId){
            return res.status(400).json({message: 'you can not send friend request to your self'})
        }

        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({message: 'user not found'})
        }

        const targetUser = await User.findById(targetUserId)
        if(!targetUser){
            return res.status(404).json({message: 'user not found'})
        }

        if(user.friends.some(f => f.toString() === targetUserId)){
            return res.status(400).json({message: 'user is already your friend'})
        }

        const alreadySent = targetUser.friendRequests.some(
            r => r.from.toString() === userId && r.status === 'pending'
        )
        if(alreadySent) return res.status(400).json({ message: 'request already sent' })


        targetUser.friendRequests.push({ from: userId, status: "pending" })
        await targetUser.save()

        res.status(200).json({ message: 'Friend request sent' })


    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}

exports.acceptFriendRequest = async (req, res) => {
    try{

        const requesterId = req.params.id
        const acceptor = req.user.id

        const acceptorUser = await User.findById(acceptor)
        if(!acceptorUser){
            return res.status(404).json({message: 'user not found'})
        }

        const request = acceptorUser.friendRequests.find(
            r => r.from.toString() === requesterId && r.status === 'pending'
        )
        if(!request){
            return res.status(404).json({message: 'request not found'})
        }

        request.status = 'accepted'

        if(!acceptorUser.friends.includes(requesterId)) {
          acceptorUser.friends.push(requesterId)
        }

        const requesterUser = await User.findById(requesterId)
        if(requesterUser && !requesterUser.friends.includes(acceptor)) {
          requesterUser.friends.push(acceptor)
          await requesterUser.save()
        }

        await acceptorUser.save()

        res.status(200).json({ message: 'Friend request accepted' })

    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}

exports.rejectFriendRequest = async (req, res) => {
    try{

        const requesterId = req.params.id
        const userId = req.user.id

        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({message: 'User not found'})
        }

        const friendRequest = await user.friendRequests.some((request) => request.from.toString() === requesterId, request.status === "pending")
        if(!friendRequest){
            return res.status(404).json({message: 'Request not found'})
        }

        await User.findByIdAndUpdate(userId, {
            friendRequests: { status: "rejected" }
        })

        res.status(200).json({message: 'Friend request rejected'})

    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}

exports.getFriendRequests = async (req, res) => {
    try{

        const userId = req.user.id

        const user = await User.findById(userId)
            .populate('friendRequests.from', 'username email avatar isOnline')
        if(!user){
            return res.status(404).json({message: 'user not found'})
        }

        const filteredRequests = user.friendRequests.filter((status) => status.status === 'pending')

        res.status(200).json({message: 'requests received successfully', filteredRequests})

    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}

exports.getFriends = async (req, res) => {
    try{

        const userId = req.user.id

        const user = await User.findById(userId).populate('friends', 'username avatar isOnline lastSeen')
        if(!user){
            return res.status(404).json({message: 'user not found'})
        }

        res.status(200).json({message: 'Friends received successfully!', user})

    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}


exports.removeFriend = async (req, res) => {
    try{

        const friendId = req.params.id
        const userId = req.user.id

        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({message: 'user not found'})
        }

        if(!user.friends.some(friend => friend.toString() === friendId)) {
            return res.status(400).json({message: 'This user is not your friend'})
        }

        await User.findByIdAndUpdate(userId, {
            friends: { $pull: friendId }
        })

        await User.findByIdAndUpdate(friendId, {
            friends: { $pull: userId }
        })
        
        res.status(200).json({message: 'friend removed successfully'})

    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}