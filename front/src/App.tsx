import { Routes, Route } from 'react-router-dom'
import { Login } from './pages/login/Login'
import { Register } from './pages/login/Register'
import { Home } from './pages/home/Home'

function App() {
  return (
    <>

      <Routes>
        <Route path='/' element={ <Home /> } />
        <Route path='/login' element={ <Login /> } />
        <Route path='/register' element={ <Register /> } />
      </Routes>

    </>
  )
}

export default App
