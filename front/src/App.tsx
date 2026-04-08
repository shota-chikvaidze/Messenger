import { Routes, Route, Navigate } from 'react-router-dom'
import { Register } from './pages/login/Register'
import { Home } from './pages/home/Home'
import { FindUsers } from './pages/findUsers/FindUsers'

import { Toaster } from 'react-hot-toast'
import { toastStyles } from './utils/toast'

import { PrivateRoute } from './components/guards/AuthGuard'
import { useInitAuth } from './hooks/useInitAuth'
import { SidebarWrapper } from './components/sidebarWrapper/SidebarWrapper'

function App() {
  
  useInitAuth()

  return (
    <>

      <Toaster position="top-right" toastOptions={toastStyles} />

      <Routes>
        <Route path='/' element={ <Home /> } />
        <Route path='/register' element={ <Register /> } />


        <Route element={ <PrivateRoute /> }>
          <Route element={ <SidebarWrapper /> } path='/' >
            
            <Route path='/find-friends' element={ <FindUsers /> } />
            <Route index element={ <FindUsers /> } />

          </Route>
        </Route>

        <Route path='*' element={ <Navigate to={'/'} /> } />
      </Routes>

    </>
  )
}

export default App
