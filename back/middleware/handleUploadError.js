const multer = require('multer')

// error handling for uploading images
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message })
    } else if (err) {
        return res.status(400).json({ message: err.message })
    }
    next()
}

module.exports = handleUploadError