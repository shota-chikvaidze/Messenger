import { io } from 'socket.io-client'

const socket = io('http://localhost:5000', {
    withCredentials: true,
    transports: ["websocket"],
    autoConnect: true
})

export default socket