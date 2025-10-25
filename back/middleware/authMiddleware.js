const jwt = require('jsonwebtoken')
const User = require('../models/User')

const authMiddleware = async (req, res, next) => {

    const token = req.cookies.token
    if(!token){
        return res.status(401).json({message: 'no token'})
    }

    try{

        const decoded = jwt.verify(token, process.env.JWT)
        req.user = await User.findById(decoded.id).select('-password')
        next()

    }catch(err){
        res.status(401).json({message: 'invalid token', error: err.message})
    }

}

module.exports = authMiddleware