import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../store/useAuth'
import { RegisterEndpoint, type RegisterPayload } from '../../api/endpoints/auth'
import { useNavigate } from 'react-router-dom'
import { showSuccessToast, showErrorToast } from '../../utils/toast'


export const Register = () => {

    const navigate = useNavigate()
    const [registerPaylod, setRegiterPayload] = useState<RegisterPayload>({
        email: '',
        password: '',
        username: ''
    })
    const setAuth = useAuth((s) => s.setAuth)

    const registerMutation = useMutation({
        mutationKey: ['register-mutation'],
        mutationFn: (payload: RegisterPayload) => RegisterEndpoint(payload),
        onSuccess: (data) => {
            setAuth(data.user, data.accessToken)
            navigate('/profile')
            showSuccessToast(data?.message || "Registered successfully!")
        },
        onError: (error: any) => {
          showErrorToast(error?.response?.data?.message || 'Failed to register')
        }
    })

    const handleRegisterMutation = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        registerMutation.mutate(registerPaylod)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRegiterPayload({...registerPaylod, [e.target.name]: e.target.value})
    }

  return (
    <div className="min-h-[90vh] flex items-center justify-center">

      <form 
        onSubmit={handleRegisterMutation}
        className="w-full max-w-sm text-right bg-white rounded-2xl "
      >
      
        <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          Create an account
        </h1>

        <div className="flex flex-col gap-4">
            
          <div className='text-left '>
            <label className='text-sm '> Username </label>
            <input
              type="text"
              name="username"
              value={registerPaylod.username}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-100 focus:outline-none focus:border-gray-400 text-sm"
            />
          </div>

          <div className='text-left '>
            <label className='text-sm '> Email </label>
            <input
              type="email"
              name="email"
              value={registerPaylod.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-100 focus:outline-none focus:border-gray-400 text-sm"
            />
          </div>

          <div className='text-left '>
            <label className='text-sm '> Password </label>
            <input
              type="password"
              name="password"
              value={registerPaylod.password}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-100 focus:outline-none focus:border-gray-400 text-sm"
            />
          </div>

        </div>

        <button
          type="submit"
          className="w-full my-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 cursor-pointer transition"
        >
          Create Accound
        </button>

        <span className='text-right '>
          Already have an account? <Link className='text-blue-600 font-bold ' to={'/login'}> Login </Link>
        </span>

      </form>

    </div>
  )
}
