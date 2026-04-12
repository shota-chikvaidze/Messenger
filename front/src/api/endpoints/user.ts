import axios from '../axios'

export interface User {
    _id: string,
    email: string,
    username: string,
    avatar: string
}

export interface GetUsersResponse {
  message: string
  users: User[]
}

export const GetUsersEndpoint = async (): Promise<GetUsersResponse> => {
    const res = await axios.get('/user/get-users')
    return res.data
}