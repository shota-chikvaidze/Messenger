const express = require("express")
const messageController = require('../controllers/Message.controller')
const protect = require('../middleware/protect')
const router = express.Router()

router.get('/get-messages/:id', protect, messageController.getMessages)
router.post('/send-message/:id', protect, messageController.sendMessage)
router.delete('/delete-message', protect, messageController.deleteMessage)
router.patch('/mark-as-read', protect, messageController.markAsRead)
router.patch('/edit-message', protect, messageController.editMessage)

module.exports = router