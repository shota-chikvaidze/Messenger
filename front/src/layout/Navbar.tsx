import { Link } from 'react-router-dom'
import { FaSnapchat } from "react-icons/fa6";

import { useAuth } from '../store/useAuth'


const Navbar = () => {
  
  const user = useAuth((store) => store.user)
  
  return (
    <nav className='bg-white w-full h-[80px] flex justify-center '>
      <div className=' px-6 w-full flex justify-between items-center '>
          
        <Link to={'/home'} className='flex items-center '>
          <h1 className='text-2xl font-medium '> Bondly </h1>
        </Link>

        {user ? (
          <Link to={'/profile'}>
            <button className="cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
              Dashboard
            </button>
          </Link>
        ) : (
          <Link to={'/register'}>
            <button className="cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
              Create an Account
            </button>
          </Link>
        )}

      </div>
    </nav>
  )
}

export default Navbar