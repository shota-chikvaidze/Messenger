const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('../models/User')
const crypto = require('crypto')
const sendEmail = require('../utils/sendEmail')

exports.register = async (req, res) => {
    
    const { name, lastname, email, password } = req.body

    if(!name || !lastname || !email || !password){
        return res.status(400).json({message: 'all fields required'})
    }

    const checkUser = await User.findOne({email})
    if(checkUser){
        return res.status(400).json({message: 'user already exists'})
    }
    
    try{

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await User.create({
            name,
            lastname,
            email,
            password: hashedPassword
        })


        const token = jwt.sign({ id: newUser._id }, process.env.JWT, {
            expiresIn: '2d'
        })

        res.status(201).json({message: 'user created successfuly', token, user: {
            id: newUser._id,
            name: newUser.name,
            lastname: newUser.lastname,
            email: newUser.email,
            avatarUrl: newUser.avatarUrl
        }})


    }catch(err){
        res.status(500).json({message: 'error creating user', error: err.message})
    }
}


exports.login = async (req, res) => {    
    
    const { email, password } = req.body

    try{

        const checkUser = await User.findOne({email})
        if(!checkUser){
            return res.status(400).json({message: 'user not exists'})
        }

        const matchPassword = await bcrypt.compare(password, checkUser.password)
        if(!matchPassword){
            return res.status(400).json({message: 'invalid password'})
        }

        const token = jwt.sign({ id: checkUser._id }, process.env.JWT, {
            expiresIn: '2d'
        })

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 2 * 24 * 60 * 60 * 1000
        })

        res.status(200).json({message: 'user logged in successfully', token, user: {
            id: checkUser._id,
            name: checkUser.name,
            lastname: checkUser.lastname,      
            email: checkUser.email,
            avatarUrl: checkUser.avatarUrl
        }})

    }catch(err){
        res.status(500).json({message: 'error', error: err.message})
    }
}

exports.forgotPassword = async (req, res) => {
    try{

        const { email } = req.body
        const user = await User.findOne({ email })
        if(!user) {
            return res.status(404).json({message: 'user not found'})
        }

        const resetToken = crypto.randomBytes(32).toString('hex')
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

        user.resetPasswordToken = hashedToken
        user.tokenExpire = Date.now() + 15 * 60 * 1000
        await user.save()

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`
        const message = `Click here to reset password ${resetUrl}`

        await sendEmail(user.email, 'Password reset', message)

        res.json({message: "Reset link sent to email"})

    }catch(err){
        res.status(500).json({message: 'error', error: err.message})
    }
}

exports.resetPassword = async (req, res) => {
    try{

        const { token } = req.params
        const { password } = req.body

        const hashedPassword = crypto.createHash('sha256').update(token).digest('hex')
        const user = await User.findOne({
            resetPasswordToken: hashedPassword,
            tokenExpire: { $gt: Date.now() }
        })

        if(!user){
            return res.status(400).json({message: 'expired token'})
        }

        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(password, salt)

        user.resetPasswordToken = undefined
        user.tokenExpire = undefined
        
        
        await user.save()
        res.status(200).json({message: 'password reset successful'})

    }catch(err){
        res.status(500).json({message: 'error reseting password', error: err.message})
    }
}

exports.getMe = async (req, res) => {
    try{

        const user = await User.findById(req.user.id).select('-password')
        if(!user){
            return res.status(404).json({message: 'user not found'})
        }

        res.status(200).json({user})

    }catch(err){
        res.status(500).json({message: 'error fetching user', error: err.message})
    }
}

exports.logOut = async (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    })
    res.status(200).json({message: 'user logged ou successfuly'})
}