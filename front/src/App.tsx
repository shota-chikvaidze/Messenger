import { Routes, Route, Navigate } from 'react-router-dom'
import { Register } from './pages/register/Register'
import { Login } from './pages/register/Login'
import { Home } from './pages/home/Home'
import { FindUsers } from './pages/findUsers/FindUsers'
import { AllFriends } from './pages/findUsers/AllFriends'
import { FriendRequests } from './pages/friendRequests/FriendRequests'
import { Profile } from './pages/profile/Profile'
import Chat from './components/Chat/Chat'

import { Toaster } from 'react-hot-toast'
import { toastStyles } from './utils/toast'

import { PrivateRoute } from './components/guards/PrivateRouteGuard'
import { AuthGuard } from './components/guards/AuthGuard'
import { useInitAuth } from './hooks/useInitAuth'
import SidebarWrapper from './components/sidebarWrapper/SidebarWrapper'
import NavbarWrapper from './components/sidebarWrapper/NavbarWrapper'

function App() {
  
  useInitAuth()

  return (
    <>
      <Toaster position="top-right" toastOptions={toastStyles} />

      <Routes>

      <Route element={<NavbarWrapper />} path='/'>
            
        <Route path='home' element={<Home />} />

        <Route element={ <AuthGuard /> }>
          <Route path='register' element={<Register />} />
          <Route path='login' element={<Login />} />
        </Route>

        <Route index element={<Home />} />

      </Route>


        <Route element={<PrivateRoute />}>
          <Route element={<SidebarWrapper />} path='/profile'>
            
            <Route path='friend-requests' element={<FriendRequests />} />
            <Route path='friends' element={<AllFriends />} />
            <Route path='edit' element={<Profile />} />
            <Route path='find-friends' element={<FindUsers />} />
            <Route path='chat/:id' element={<Chat />} />
          
          </Route>
          
        </Route>

        <Route path='*' element={<Navigate to='/home' />} />

      </Routes>
    </>
  )
}

export default App
