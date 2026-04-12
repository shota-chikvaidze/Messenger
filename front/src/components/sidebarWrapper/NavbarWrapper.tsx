import React from 'react'
import Navbar from '../../layout/Navbar'
import { Outlet } from 'react-router-dom'

const NavbarWrapper = () => {
  return (
    <div className="flex flex-col ">

        <Navbar />
        <Outlet />

    </div>
  )
}

export default NavbarWrapper