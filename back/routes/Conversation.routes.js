const express = require("express")
const conversationController = require('../controllers/Conversation.controller')
const protect = require('../middleware/protect')
const router = express.Router()

router.get('/get-conversations', protect, conversationController.getMyConversations)
router.get('/get-conversations-id/:id', protect, conversationController.getConversationById)
router.post('/create-conversations', protect, conversationController.createConversation)
router.post('/create-group-conversations', protect, conversationController.createGroupConversations)
router.post('/add-participant/:id', protect, conversationController.addParticipant)
router.delete('/leave-conversation/:id', protect, conversationController.leaveConversation)

module.exports = router 