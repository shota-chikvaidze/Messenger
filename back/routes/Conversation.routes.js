const express = require("express")
const conversationController = require('../controllers/Conversation.controller')
const protect = require('../middleware/protect')
const upload = require('../middleware/upload')
const handleUploadError = require('../middleware/handleUploadError')
const router = express.Router()

router.get('/get-conversations', protect, conversationController.getMyConversations)
router.get('/get-conversations-id/:id', protect, conversationController.getConversationById)
router.post('/create-conversations', protect, conversationController.createConversation)
router.post('/create-group-conversations', protect, conversationController.createGroupConversations)
router.post('/add-participant/:id', protect, conversationController.addParticipant)
router.put('/update-conversation/:id', protect, upload.single('groupAvatar'), handleUploadError, conversationController.updateConversation)
router.delete('/leave-conversation/:id', protect, conversationController.leaveConversation)

module.exports = router 
