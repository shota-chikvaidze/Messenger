const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    storage: function (req, res, cb) {
        cb(null, 'uploads/')
    },

    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }

})

function fileFilter(req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'application/pdf']
    if(allowedTypes.includes(file.mimetype)){
        cb(null, true)
    }else {
        cb(null, new Error('invalid file type', false))
    }
}

const upload = multer({storage, fileFilter})
module.exports = upload