const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
    try {
        let token

        // Get token from Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1]
        }

        if (!token) {
            return res.status(401).json({ message: 'არ ხართ ავტორიზებული' })
        }

        // Verify access token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Get user
        const user = await User.findById(decoded.id).select('-password')

        if (!user) {
            return res.status(401).json({ message: 'მომხმარებელი ვერ მოიძებნა' })
        }

        req.user = user
        next()

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'ტოკენი ვადაგასულია' })
        }
        
        return res.status(401).json({ message: 'არასწორი ტოკენი' })
    }
}

module.exports = protect