const User = require('../models/User')

exports.getUsers = async (req, res) => {
    try{

        const users = await User.find().sort({ createdAt: -1 })
        res.status(200).json({message: 'Users received successfully', users})

    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}