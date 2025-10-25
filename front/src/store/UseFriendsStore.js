import { create } from 'zustand'
import axios from '../api/axios'
import { useParams } from 'react-router-dom'

const UseFriendsStore = create((set, get) => ({
    userFriends: [],
    friendRequests: [],
    

    fetchFriends: async () => {
        try{

            const res = await axios.get('/request/friends')
            set({ userFriends: res.data.friends })

        }catch(err){
            console.error('error', err)
        }
    },

    fetchFriendsReq: async () => {
        try{

            const res = await axios.get('request/get-request')
            set({ friendRequests: res.data })

        }catch(err){
            console.error('error', err)
        }
    },

    acceptReq: async (reqId) => {
        try{

            const res = await axios.post('/request/accept-request', {
                requestId: reqId
            })

            set(state => ({
                friendRequests: state.friendRequests.filter(r => r._id !== reqId)
            }))

            await Promise.all([
                get().fetchFriends(),
                get().fetchFriendRequests()
            ])


        }catch(err){
            console.error('error', err)
        }
    },

    rejectReq: async (reqId) => {
        try{

            const res = await axios.post('/request/reject-request', {
                requestId: reqId
            })
            set(state => ({
                friendRequests: state.friendRequests.filter(r => r._id !== reqId)
            }))

            await get().fetchFriends()

        }catch(err){
            console.error('error', err)
        }
    }

}))

export default UseFriendsStore