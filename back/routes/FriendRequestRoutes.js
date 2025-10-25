const express = require('express')
const friendRequestController = require('../controller/FriendRequest')
const authMiddleware = require('../middleware/authMiddleware')
const router = express.Router()

router.post('/send-request', authMiddleware, friendRequestController.sendRequest)
router.post('/accept-request', authMiddleware, friendRequestController.acceptRequest)
router.post('/reject-request', authMiddleware, friendRequestController.declineRequest)
router.get('/get-request', authMiddleware, friendRequestController.getRequest)
router.get('/block', authMiddleware, friendRequestController.blockUser)
router.get('/unblock', authMiddleware, friendRequestController.unblockUser)
router.get('/friends', authMiddleware, friendRequestController.userFriends)
router.get('/search-users', authMiddleware, friendRequestController.searchUsers)

module.exports = router