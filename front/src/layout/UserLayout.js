import React from 'react'
import { Link, Outlet } from 'react-router-dom'

import { BiSolidMessageRounded } from "react-icons/bi";
import { HiOutlineBuildingStorefront } from "react-icons/hi2";
import { RiMessage2Fill } from "react-icons/ri";
// import { UserDashboard } from '../pages/user/UserDashboard'
import DefaultLogo from '../assets/images/facebook-default-pfp.png'
import axios from '../api/axios';


const UserLayout = () => {

  const LogOut = async () => {
    try{

      const res = await axios.post('/auth/logOut')
      alert('Logged out successfully')

    }catch(err){
      console.error(err)
    }
  }

  return (
    <div className='user_layout'>

      <div className='user_container'>
        <div className='user_links'>
          <Link to={'/dashboard'}>
            <BiSolidMessageRounded className='user_sidebar_icon' />
          </Link>
          <Link>
            <HiOutlineBuildingStorefront className='user_sidebar_icon' />
          </Link>
          <Link to={'/friend-request'}>
            <RiMessage2Fill className='user_sidebar_icon' />
          </Link>
        </div>
        <div className='user_profile'>
          <img src={DefaultLogo} alt='Facebook Default Profile Picture' onClick={LogOut} />
        </div>
      </div>

      <div className='children'>
        <Outlet />
      </div>

    </div>
  )
}

export default UserLayout