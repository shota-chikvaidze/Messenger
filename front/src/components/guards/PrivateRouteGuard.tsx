import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../store/useAuth'
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export const PrivateRoute = () => {
  const user = useAuth((state) => state.user)
  const isInitialized = useAuth((state) => state.isInitialized)

  if(isInitialized === false) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <AiOutlineLoading3Quarters
          className="animate-spin text-3xl text-gray-500"
        />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}