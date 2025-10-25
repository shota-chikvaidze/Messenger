import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from '../../api/axios'
import socket from '../../socket'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchUser = async () => {
        try{
            setLoading(true)

            const res = await axios.get('/auth/me')
            setUser(res.data.user)

        }catch(err){
            setUser(null)
        }finally{
            setLoading(false)   
        }
    }

    useEffect(() => {
        fetchUser()
    }, [])

    useEffect(() => {
        if (!user) return

        socket.connect()

        return () => {
            socket.disconnect()
        }
    }, [user])

    useEffect(() => {
        
        if(user){
            document.body.classList.add('logged_in')
            document.body.classList.remove('not_logged_in')
        }else{
            document.body.classList.remove('logged_in')
            document.body.classList.add('not_logged_in')
        }

    }, [user])


  return (
    <>
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    </>
  )
}

export const useAuth = () => useContext(AuthContext)