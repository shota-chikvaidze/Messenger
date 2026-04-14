const express = require("express")
const userController = require('../controllers/User.controller')
const protect = require('../middleware/protect')
const upload = require('../middleware/upload')
const handleUploadError = require('../middleware/handleUploadError')
const router = express.Router()

router.get('/get-users', protect, userController.getUsers)
router.put('/update-avatar', upload.single("avatar"), handleUploadError, protect, userController.updateAvatar)

module.exports = router