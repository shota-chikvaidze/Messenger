const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary')

const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const fileFilter = (req, file, cb) => {
    if(allowedFormats.includes(file.mimetype)) {
        cb(null, true)
    }else {
        cb(new Error('Only JPEG, JPG, PNG, WEBP images are allowed'), false)
    }
}

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'avatars',

        transformation: [
            {
                width: 300,
                height: 300,
                crop: 'fill',
                gravity: 'face', // focuses on face if detected
            }
        ],

        format: async (req, file) => "webp"
    }
})

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024, 
    },
})

module.exports = upload