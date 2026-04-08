const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require('../models/User')
const RefreshToken = require("../../../Learn-ai/back/models/RefreshToken")

exports.register = async (req, res) => {
    try{

        const { username, email, password } = req.body
        if(!username || !email || !password){
            return res.status(400).json({message: 'all fields required'})
        }

        const checkUser = await User.findOne({email})
        if(checkUser){
            return res.status(400).json({message: 'user already exists'})
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const createUser = await User.create({
            username,
            email,
            password: hashedPassword
        })

        const accessToken = jwt.sign({ id: createUser._id }, process.env.JWT_SECRET, {
            expiresIn: "15m"
        })

        // const refreshToken = await RefreshToken.createToken(createUser._id)

        
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        }

        res.cookie('accessToken', accessToken, cookieOptions)

        res.status(201).json({
            message: "User registered successfully",
            success: true,
            accessToken,
            user: {
              id: createUser._id,
              email: createUser.email,
              username: createUser.username,
            }
        })

    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}

exports.login = async (req, res) => {
    try{

        const { email, password } = req.body
        if(!email || !password){
            return res.status(400).json({message: 'all fields required'})
        }

        const findUser = await User.findOne({email})
        if(!findUser){
            return res.status(404).json({message: 'user not found'})
        }

        const comparePass = await bcrypt.compare(password, findUser.password)
        if(!comparePass){
            return res.status(400).json({message: 'invalid credentials'})
        }

        const accessToken = jwt.sign({ id: findUser._id }, process.env.JWT_SECRET, {
            expiresIn: "15m"
        })


        // const refreshToken = await RefreshToken.createToken(findUser._id)

        
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/',
        }

        res.cookie('accessToken', accessToken, cookieOptions)

        res.status(201).json({
            message: "User logged in successfully",
            success: true,
            accessToken,
            user: {
              id: findUser._id,
              email: findUser.email,
              username: findUser.username,
            }
        })

    }catch(err){
        res.status(500).json({message: 'Server error', error: err.message})
    }
}

exports.refreshToken = async (req, res) => {
    try{

        const { refreshToken } = req.cookies

        if(!refreshToken){
            return res.status(404).json({message: 'not authorized'})
        }

        const userId = await RefreshToken.verifyToken(refreshToken)

        const clearOptions = {
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        }
        
        const user = await User.findById(userId)
        if(!user){
            await RefreshToken.logout(refreshToken)
            res.clearCookie('refreshToken', { ...clearOptions, httpOnly: true })
            return res.status(401).json({ message: 'user not found' })
        }

        if(!userId){
            res.clearCookie('refreshToken', { ...clearOptions, httpOnly: true })
            return res.status(401).json({ message: 'invalid or expired token' })
        }

        // Generate new access token
        const accessToken = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '15m' }
        )


        res.status(200).json({
            accessToken,
            user: {
                id: user._id,
                avatarConfig: user.avatarConfig,
                name: user.name,
                lastname: user.lastname,
                createdAt: user.createdAt,
                email: user.email,
                role: user.role,
                hearts: user.hearts,
                xp: user.xp,
                onboardingCompleted: user.onboardingCompleted,
                learningGoal: user.learningGoal,
                stats: user.stats,
                achievements: user.achievements,
                purchasedCourses: user.purchasedCourses
            }
        })

    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}

exports.logout = async (req, res) => {
    try {
        
        const { refreshToken } = req.cookies

        if (refreshToken) {
            await RefreshToken.logout(refreshToken)
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        })

        res.status(200).json({ message: 'loged out successfully' })
        
    } catch(err) {
        res.status(500).json({message: 'Server error'})
    }
}

exports.me = async (req, res) => {
    try{

        const userDoc = await User.findById(req.user.id)
        if(!userDoc){
            return res.status(401).json({message: 'user not found'})
        }

        const { password, ...userObj } = userDoc.toObject()
        res.status(200).json({ user: { ...userObj, hasPassword: !!password } })

    }catch(err){
        res.status(500).json({message: 'Server error'})
    }
}