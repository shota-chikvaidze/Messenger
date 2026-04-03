const express = require("express")
const authController = require('../controllers/Auth.controller')
const router = express.Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/logout', authController.logout)
router.post('/refresh-token', authController.refreshToken)
router.get('/me', authController.me)

module.exports = router