const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')
const http = require('http')
const { Server } = require('socket.io')
const cookieParser = require('cookie-parser')

const userRoutes = require('./routes/userRoutes')
const friendRequestRoutes = require('./routes/FriendRequestRoutes')
const chatRoutes = require('./routes/ChatRoutes')
const initSocket = require('./socket')

dotenv.config()

const app = express()
const server = http.createServer(app)

const io = new Server(server, { cors: { origin: 'http://localhost:3000' } })

initSocket(io)

app.use(express.json())
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))
app.use(cookieParser())

app.use('/api/auth', userRoutes)
app.use('/api/request', friendRequestRoutes)
app.use('/api/chat', chatRoutes)


const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGODB, {

}).then(() => {
    console.log('mongoDB connected successfuly')
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})