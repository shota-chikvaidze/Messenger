const express = require("express")
const conversationController = require('../controllers/Conversation.controller')
const router = express.Router()

router.get('/get-conversations', conversationController.getMyConversations)
router.get('/get-conversations-id/:id', conversationController.getConversationById)
router.post('/create-conversations', conversationController.createConversation)
router.post('/create-group-conversations', conversationController.createGroupConversations)
router.post('/add-participant/:id', conversationController.addParticipant)
router.delete('/leave-conversation/:id', conversationController.leaveConversation)

module.exports = router