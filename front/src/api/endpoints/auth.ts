import axios from '../axios'

export interface LoginPayload {
    email: string,
    password: string
}

export interface RegisterPayload {
    email: string,
    username: string,
    password: string
}

export interface MeType {
    id: string,
    email: string,
    username: string
    avatar: string
    friends: string[]
}

export const LoginEndpoint = async (payload: LoginPayload) => {
    const res = await axios.post('/auth/login', payload)
    return res.data
}

export const RegisterEndpoint = async (payload: RegisterPayload) => {
    const res = await axios.post('/auth/register', payload)
    return res.data
}

export const MeEndpoint = async (): Promise<{ user: MeType }> => {
    const res = await axios.get<{ user: MeType }>('/auth/me')
    return res.data
}

export const LogoutEndpoint = async ()  => {
    const res = await axios.post('/auth/logout')
    return res.data
}
