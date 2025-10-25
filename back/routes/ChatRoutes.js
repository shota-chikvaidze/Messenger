const express = require('express')
const chatController = require('../controller/Chat')
const messageController = require('../controller/Message')
const authMiddleware = require('../middleware/authMiddleware')
const uplaod = require('../middleware/uplaod')

const router = express.Router()

router.post('/chats', authMiddleware, chatController.startChat)
router.get('/chats/:conversationId', authMiddleware, chatController.getChatId)
router.delete('/chats/delete/:conversationId', authMiddleware, chatController.deleteChat)
router.get('/chats/:conversationId/messages', authMiddleware, messageController.getMessages)

router.post('/messages', authMiddleware, messageController.sendMessage)
router.post('/messages/attachments', authMiddleware, uplaod.array('attachments', 5), messageController.attachments)
router.patch('/messages/:id/read', authMiddleware, messageController.markAsRead)

module.exports = router
