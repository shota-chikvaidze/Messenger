import React from 'react'
import './Layout.css'
import { Link } from 'react-router-dom'
import Logo from '../assets/images/messenger-logo.png'

const Layout = () => {
  return (
    <>
        <header>
            <div className='header_container'>
              <Link to={'/'}>
                <div className='website_logo'> 
                    <img src={Logo} alt='website logo' />
                </div>
              </Link>
            </div>
        </header>
    </>
  )
}

export default Layout