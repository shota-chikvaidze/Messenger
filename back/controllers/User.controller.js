const User = require('../models/User')
const cloudinary = require('../config/cloudinary')

exports.getUsers = async (req, res) => {
    try{
        const userId = req.user.id

        const users = await User.find({ _id: { $ne: userId } }).sort({ createdAt: -1 })
        res.status(200).json({message: 'Users received successfully', users})

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

        res.status(200).json({ message: 'Avatar updated', user})

    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}