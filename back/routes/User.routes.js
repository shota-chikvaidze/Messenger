const express = require("express")
const userController = require('../controllers/User.controller')
const protect = require('../middleware/protect')
const router = express.Router()

router.get('/get-users', protect, userController.getUsers)

module.exports = router