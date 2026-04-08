import axios from '../axios'

export interface User {
    id: string,
    email: string,
    username: string
}

export const GetUsersEndpoint = async (): Promise<User[]> => {
    const res = await axios.get<User[]>('/user/get-users')
    return res.data
}