import React, { useState, useEffect } from 'react'
import './Register.css'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../../components/authProvider/AuthProvider'

import Logo from '../../assets/images/messenger-logo.png'

export const Register = () => {

    const setUser = useAuth()

    const [form, setForm] = useState({
        name: '',
        lastname: '',
        email: '',
        password: '',
    })

    const handleChange = (e) => {
        setForm({...form, [e.target.name]: e.target.value})
    }

    const submitForm = async (e) => {
        e.preventDefault()

        try{

            const res = await axios.post('http://localhost:5000/api/auth/register', form, { withCredentials: true })

            if(res.status === 201 && res.data.token){
                localStorage.setItem('token', res.data.token)
                window.location.href = '/';
                setUser(res.data.user)
            }

        }catch(err){
            console.log('error', err)
        }
    }

  return (
    <>
        <section className='registration_section'>
            <div className='registration_container'>
                <div className='registration_logo'>
                    <img src={Logo} alt='website logo' className='' />
                    <h1>Messenger</h1>
                </div>
                <form onSubmit={submitForm} className='registration_form'>
                    <input name='name' type='text' placeholder='Your Name' onChange={handleChange} required />
                    <input name='lastname' type='text' placeholder='Your Lastname' onChange={handleChange} required />
                    <input name='email' type='email' placeholder='Your Email' onChange={handleChange} required />
                    <input name='password' type='password' placeholder='Your Password' onChange={handleChange} required />
                    <button type='submit'>
                        Register
                    </button>
                </form>
                <div className='registration_have_acc_text'>
                    <p>Have an account? <Link to={'/login'}>Login</Link> </p>
                </div>
            </div>
        </section>
    </>
  )
}
