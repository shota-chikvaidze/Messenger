import axios from '../axios'

export interface Friend {
    id: string
    username: string
    avatar: string
    isOnline: boolean
    lastSeen: string
}

export interface FriendRequest {
    id: string
    from: {
      id: string
      username: string
      email: string
      avatar?: string
      isOnline?: boolean
    }
    status: string
}

export interface GetFriendRequestsResponse {
    message: string
    filteredRequests: FriendRequest[]
}

export const GetFriendsEndpoint = async (search: string): Promise<Friend[]> => {
    const res = await axios.get('/friends/get-friends', {
        params: { search }
    })
    return res.data.friends
}

export const SendFriendReqEndpoint = async (id: string) => {
    const res = await axios.post(`/friends/send-friend-request/${id}`)
    return res.data
}

export const AcceptFriendReqEndpoint = async (id: string) => {
    const res = await axios.patch(`/friends/accept-friend-request/${id}`)
    return res.data
}

export const RejectFriendReqEndpoint = async (id: string) => {
    const res = await axios.patch(`/friends/reject-friend-request/${id}`)
    return res.data
}

export const GetFriendReqEndpoint = async (): Promise<GetFriendRequestsResponse> => {
    const res = await axios.get<GetFriendRequestsResponse>(`/friends/get-friend-requests`)
    return res.data
}

export const RemoveFriendEndpoint = async (id: string) => {
    const res = await axios.delete(`/friends/remove-friend/${id}`)
    return res.data
}