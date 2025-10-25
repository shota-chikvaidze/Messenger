import React, { useState, useEffect } from 'react'
import axios from '../../api/axios'
import './Login.css'
import { Link } from 'react-router-dom'
import { useAuth } from '../../components/authProvider/AuthProvider'
import { useNavigate } from 'react-router-dom'

import Logo from '../../assets/images/messenger-logo.png'

export const Login = () => {

    const navigate = useNavigate()
    const { setUser } = useAuth()

    const [form, setForm] = useState({
        email: '',
        password: ''
    })

    const handleChange = (e) => {
        setForm({...form, [e.target.name]: e.target.value})
    }

    const submitForm = async (e) => {
        e.preventDefault()

        try{

            const res = await axios.post('/auth/login', form)
            setUser(res.data.user);
            navigate('/dashboard')

        }catch(err){
            console.log('error', err)
        }

    }

  return (
    <>
        <section className='registration_section'>
            <div className='registration_container'>
                <div className='registration_logo'>
                    <img src={Logo} alt='website logo' />
                    <h1>Messenger</h1>
                </div>
                <form onSubmit={submitForm} className='registration_form'>
                    <input name='email' type='email' placeholder='Your Email' onChange={handleChange} required />
                    <input name='password' type='password' placeholder='Your Password' onChange={handleChange} required />
                    <button type='submit'>
                        Login
                    </button>
                </form>
                <div className='registration_have_acc_text'>
                    <p>Dont have an account? <Link to={'/register'}>Register</Link> </p>
                </div>
            </div>
        </section>
    </>
  )
}
