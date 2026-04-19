const express = require("express")
const friendController = require('../controllers/Friend.controller')
const protect = require('../middleware/protect')
const router = express.Router()

router.post('/send-friend-request/:id', protect, friendController.sendFriendRequest)
router.patch('/accept-friend-request/:id', protect, friendController.acceptFriendRequest)
router.patch('/reject-friend-request/:id', protect, friendController.rejectFriendRequest)
router.get('/get-friend-requests', protect, friendController.getFriendRequests)
router.get('/get-friends', protect, friendController.getFriends)
router.delete('/remove-friend/:id', protect, friendController.removeFriend)

module.exports = router