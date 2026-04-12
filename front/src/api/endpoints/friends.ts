import axios from '../axios'

export interface Friend {
    username: string
    avatar: string
    isOnline: boolean
    lastSeen: string,
    _id: string
}

export interface FriendRequest {
    _id: string
    from: {
      _id: string
      username: string
      email: string
    }
    status: string
}

export interface GetFriendRequestsResponse {
    message: string
    filteredRequests: FriendRequest[]
}

export const GetFriendsEndpoint = async (): Promise<Friend[]> => {
    const res = await axios.get('/friends/get-friends')
    return res.data.user.friends
}

export const SendFriendReqEndpoint = async (id: string) => {
    const res = await axios.post(`/friends/send-friend-request/${id}`)
    return res.data
}

export const AcceptFriendReqEndpoint = async (id: string) => {
    const res = await axios.patch(`/friends/accept-friend-request/${id}`)
    return res.data
}

export const GetFriendReqEndpoint = async (): Promise<GetFriendRequestsResponse> => {
    const res = await axios.get<GetFriendRequestsResponse>(`/friends/get-friend-requests`)
    return res.data
}

