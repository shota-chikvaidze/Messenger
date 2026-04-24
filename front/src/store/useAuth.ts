import { create } from "zustand";

interface User {
    id: string
    email: string
    username: string
    avatar: string
    friends: string[]
    isOnline?: boolean
}

interface AuthState {
    user: User | null
    isAuthenticated: boolean
    accessToken: string | null
    isInitialized: boolean
    setAuth: (user: User, accessToken: string) => void
    updateAccessToken: (accessToken: string) => void
    clearAuth: () => void
}

export const useAuth = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    accessToken: null,
    isInitialized: false,

    
    setAuth: (user, accessToken) =>
        set(() => ({
            user,
            accessToken,
            isAuthenticated: true,
            isInitialized: true
        })),

    updateAccessToken: (accessToken) =>
        set({ accessToken }),

    clearAuth: () => 
        set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isInitialized: true
        })
}))
