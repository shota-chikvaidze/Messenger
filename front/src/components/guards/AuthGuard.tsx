import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../store/useAuth'

export const AuthGuard = () => {
  const user = useAuth((state) => state.user)
  const isInitialized = useAuth((state) => state.isInitialized)

  if (!isInitialized) return null 

  if(user) {
    return <Navigate to="/profile" replace /> 
  }

  return <Outlet />
}