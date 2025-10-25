import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../components/authProvider/AuthProvider'
import Layout from './Layout'
import UserLayout from './UserLayout'

const RootLayout = () => {

  const { user } = useAuth()

  return (
    <>
      {user ? <UserLayout /> : <Layout />}
      <Outlet />
    </>
  )
}

export default RootLayout