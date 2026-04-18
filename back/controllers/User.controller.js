const User = require('../models/User')
const cloudinary = require('../config/cloudinary')

exports.getUsers = async (req, res) => {
    try{
        const userId = req.user.id
        const { search } = req.query

        const currentUser = await User.findById(userId)

        // Combine my id and my friends ids
        const excludedIds = [userId, ...currentUser.friends]

        const filter = {
            _id: { $nin: excludedIds }
        }

        if(search && search.trim !== '') {
            filter.username = {
                $regex: search.trim(),
                $options: 'i'
            }
        }

        const users = await User.find(filter)
            .sort({ createdAt: -1 })

        const formattedUsers = users.map(user => {
            const hasSentRequest = user.friendRequests.some(
                r => r.from.toString() === userId && r.status === 'pending'
            )

            return {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar || null,

                hasSentRequest
            }
        })
        
        res.status(200).json({
            message: 'Users received successfully',
            users: formattedUsers
        })

    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}

exports.updateAvatar = async (req, res) => {
    try{

        const userId = req.user.id

        if(!req.file) {
            return res.status(400).json({ message: 'No file uploaded' })
        }

        const user = await User.findById(userId)
        if(!user) {
            return res.status(404).json({message: 'User not found'})
        }

        if(user.avatarPublicId) {
            await cloudinary.uploader.destroy(user.avatarPublicId)
        }

        user.avatar = req.file.path
        user.avatarPublicId = req.file.filename

        await user.save()

        res.status(200).json({
            message: 'Avatar updated',
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                avatar: user.avatar
            }
        })

    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}
