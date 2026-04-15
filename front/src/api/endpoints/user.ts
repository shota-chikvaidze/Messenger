import axios from '../axios'

export interface User {
    id: string
    email: string
    username: string
    avatar: string | null
    hasSentRequest: boolean
}

export interface GetUsersResponse {
  message: string
  users: User[]
}

export const GetUsersEndpoint = async (): Promise<GetUsersResponse> => {
    const res = await axios.get('/user/get-users')
    return res.data
}

export const UpdateAvatarEndpoint = async (formData: FormData) => {
    const res = await axios.put('/user/update-avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    return res.data
}