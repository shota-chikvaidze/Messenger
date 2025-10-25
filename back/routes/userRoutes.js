const express = require('express')
const userController = require('../controller/User')
const authMiddleware = require('../middleware/authMiddleware')
const router = express.Router()

router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/forget-password', userController.forgotPassword)
router.post('/reset-password/:token', userController.resetPassword)
router.get('/me', authMiddleware, userController.getMe)
router.post('/logOut', userController.logOut)

module.exports = router