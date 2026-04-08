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

        const request = acceptorUser.friendRequests.some(
            r => r.from.toString() === requesterId && r.status === 'pending'
        )
        if(!request){
            return res.status(404).json({message: 'request not found'})
        }

        await User.findByIdAndUpdate(acceptor, {
            friendRequests: { status: accepted }
        })

        acceptorUser.friends.push(requesterId)

    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}

exports.getFriendRequests = async (req, res) => {
    try{

        const userId = req.user.id

        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({message: 'user not found'})
        }

        const filteredRequests = user.friendRequests.filter((status) => status.status === 'pending').populate('from', 'username email')

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