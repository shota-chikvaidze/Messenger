import { Routes, Route, Navigate } from 'react-router-dom'
import { Register } from './pages/register/Register'
import { Home } from './pages/home/Home'
import { FindUsers } from './pages/findUsers/FindUsers'
import { FriendRequests } from './pages/friendRequests/FriendRequests'
import { Profile } from './pages/profile/Profile'

import { Toaster } from 'react-hot-toast'
import { toastStyles } from './utils/toast'

import { PrivateRoute } from './components/guards/AuthGuard'
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
        <Route path='register' element={<Register />} />
        <Route index element={<Home />} />

      </Route>


        <Route element={<PrivateRoute />}>
          <Route element={<SidebarWrapper />} path='/profile'>
            
            <Route index element={<FindUsers />} />
            <Route path='friend-requests' element={<FriendRequests />} />
            <Route path='edit' element={<Profile />} />

          </Route>
          
          <Route path='/find-friends' element={<FindUsers />} />
        </Route>

        <Route path='*' element={<Navigate to='/home' />} />

      </Routes>
    </>
  )
}

export default App
