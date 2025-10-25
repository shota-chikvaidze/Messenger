import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './components/authProvider/AuthProvider'

import RootLayout from './layout/RootLayout'
import UserLayout from './layout/UserLayout'

import { Home } from './pages/home/Home'
import { Register } from './pages/register/Register'
import { Login } from './pages/login/Login'
import { UserDashboard } from './pages/user/UserDashboard'
import FriendRequest from './components/friendRequest/FriendRequest'
import Chat from './components/chat/Chat'

function App() {
  const { user, loading } = useAuth()
  if (loading) return <p>Loading...</p>

  return (
    <Routes>

      {!user && (
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Route>
      )}

      {user && (
        <Route element={<UserLayout />} >
          <Route path='/' element={ <Navigate to={'/dashboard'} /> } />

          <Route path="/dashboard" element={<UserDashboard />}>
            <Route path='chat/:conversationId' element={ <Chat /> } />
          </Route>
          <Route path="/friend-request" element={<FriendRequest />} />
          <Route path="*" element={<Navigate to="/" /> } />
        </Route>
      )}

    </Routes>
  )
}

export default App
