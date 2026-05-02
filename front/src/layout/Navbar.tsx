import { Link } from 'react-router-dom'
import { FaSnapchat } from "react-icons/fa6";

import { useAuth } from '../store/useAuth'


const Navbar = () => {
  
  const user = useAuth((store) => store.user)
  const isInitialized = useAuth((store) => store.isInitialized)
  
  return (
    <nav className='bg-white w-full h-[80px] flex justify-center '>
      <div className='flex w-full items-center justify-between px-4 sm:px-6'>
          
        <Link to={'/home'} className='flex items-center '>
          <h1 className='text-2xl font-medium '> Bondly </h1>
        </Link>

        {(!isInitialized || user) ? (
          <Link to={'/profile'}>
            <button className="cursor-pointer rounded-lg border-b-[4px] border-blue-600 bg-blue-500 px-3 py-2 text-sm text-white transition-all hover:brightness-110 active:translate-y-[2px] active:border-b-[2px] active:brightness-90 sm:px-6 sm:text-base">
              Dashboard
            </button>
          </Link>
        ) : (
          <Link to={'/register'}>
            <button className="cursor-pointer rounded-lg border-b-[4px] border-blue-600 bg-blue-500 px-3 py-2 text-sm text-white transition-all hover:brightness-110 active:translate-y-[2px] active:border-b-[2px] active:brightness-90 sm:px-6 sm:text-base">
              Create an Account
            </button>
          </Link>
        )}

      </div>
    </nav>
  )
}

export default Navbar
