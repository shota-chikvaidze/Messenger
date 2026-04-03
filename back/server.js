const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config()
const app = express()






const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGO_URL, {
    
}).then(() => {
    console.log("MongoDB connected successfully")
    app.listen(PORT, console.log('server is listening'))
})