const express = require("express")
const messageController = require('../controllers/Message.controller')
const router = express.Router()

router.get('/get-messages/:id', messageController.getMessages)
router.post('/send-message/:id', messageController.sendMessage)
router.delete('/delete-message', messageController.deleteMessage)
router.patch('/mark-as-read', messageController.markAsRead)
router.patch('/edit-message', messageController.editMessage)

module.exports = router