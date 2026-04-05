const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

const http = require('http')
const { Server } = require('socket.io')

dotenv.config()
const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL,
    }
})

// make io accessible in controllers via req.app.get('io')
app.set('io', io)

// loads socket setup file
require('./socket')(io)  








const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGO_URL, {
    
}).then(() => {
    console.log("MongoDB connected successfully")
    app.listen(PORT, console.log('server is listening'))
})