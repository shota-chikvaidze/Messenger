const express = require("express")
const authController = require('../controllers/Auth.controller')
const router = express.Router()
const protect = require('../middleware/protect')

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.post('/refresh-token', authController.refreshToken)
router.get('/me', protect, authController.me)

module.exports = router