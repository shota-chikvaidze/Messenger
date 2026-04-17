import { Link } from 'react-router-dom'
import { FaSnapchat } from "react-icons/fa6";

const Navbar = () => {
  return (
    <nav className='bg-white w-full h-[80px] flex justify-center '>
        <div className='max-w-6xl w-full flex justify-between items-center '>
            
            <Link to={'/home'}>
              <FaSnapchat className='w-9 h-9 ' />
            </Link>

            <Link to={'/register'}>
                <button className='bg-gray-800 hover:bg-gray-900 text-white px-10 py-2 cursor-pointer '> Register </button>
            </Link>

        </div>
    </nav>
  )
}

export default Navbar