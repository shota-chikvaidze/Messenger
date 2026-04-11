import axios from '../axios'

export interface Friend {
    username: string
    avatar: string
    isOnline: boolean
    lastSeen: string,
    _id: string
}


export const GetFriendsEndpoint = async (): Promise<Friend[]> => {
    const res = await axios.get('/friends/get-friends')
    return res.data.user.friends
}

export const AcceptFriendReqEndpoint = async (id: string) => {
    const res = await axios.post(`/friends/send-friend-request/${id}`)
    return res.data
}