import { Routes, Route, Navigate } from 'react-router-dom'
import { Register } from './pages/login/Register'
import { Home } from './pages/home/Home'
import { Profile } from './pages/profile/Profile'

import { PrivateRoute } from './components/guards/AuthGuard'

function App() {
  return (
    <>

      <Routes>
        <Route path='/' element={ <Home /> } />
        <Route path='/register' element={ <Register /> } />


        <Route element={ <PrivateRoute /> }>
          <Route path='/profile' element={ <Profile /> } />
        </Route>

        <Route path='*' element={ <Navigate to={'/'} /> } />
      </Routes>

    </>
  )
}

export default App
