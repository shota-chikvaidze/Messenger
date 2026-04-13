const express = require('express')
const dotenv = require('dotenv')
dotenv.config()
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const http = require('http')
const { Server } = require('socket.io')

const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
    }
})

app.use(express.json())

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}))
app.use(cookieParser())

// make io accessible in controllers via req.app.get('io')
app.set('io', io)

// loads socket setup file
require('./socket/index')(io) 


const authRoutes = require('./routes/Auth.routes')
const messageRoutes = require('./routes/Message.routes')
const conversationRoutes = require('./routes/Conversation.routes')
const userRoutes = require('./routes/User.routes')
const friendRoutes = require('./routes/Friend.routes')


app.use('/api/auth', authRoutes)
app.use('/api/message', messageRoutes)
app.use('/api/conversation', conversationRoutes)
app.use('/api/user', userRoutes)
app.use('/api/friends', friendRoutes)

app.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    status: 'ok',
    timeStamps: Date.now(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  }
  res.status(200).json(healthCheck)
})


const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGO_URL, {
    
}).then(() => {
    console.log("MongoDB connected successfully")
    app.listen(PORT, console.log('server is listening'))
})