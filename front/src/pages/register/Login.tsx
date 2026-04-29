import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LoginEndpoint, type LoginPayload } from '../../api/endpoints/auth'

import { useAuth } from '../../store/useAuth'
import { useMutation }  from '@tanstack/react-query'

import { showSuccessToast, showErrorToast } from '../../utils/toast'


export const Login = () => {


  const [userPayload, setUserPayload] = useState<LoginPayload>({
    email: '',
    password: ''
  })
  const setAuth = useAuth((s) => s.setAuth)
  const isInitialized = useAuth((state) => state.isInitialized)

  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationKey: ['login-mutation'],
    mutationFn: (payload: LoginPayload) => LoginEndpoint(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      navigate('/profile')
      showSuccessToast(data.message)
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error Occurred')
    }
  })

  const handleLoginMutation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    loginMutation.mutate(userPayload)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserPayload({...userPayload, [e.target.name]: e.target.value})
  }

  if (!isInitialized) return null

  return (
    <div className="min-h-[90vh] flex items-center justify-center">

      <form 
        onSubmit={handleLoginMutation}
        className="w-full max-w-sm text-right bg-white rounded-2xl "
      >
      
        <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          Create an account
        </h1>

        <div className="flex flex-col gap-4">

          <div className='text-left '>
            <label className='text-sm '> Email </label>
            <input
              type="email"
              name="email"
              value={userPayload.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-100 focus:outline-none focus:border-gray-400 text-sm"
            />
          </div>

          <div className='text-left '>
            <label className='text-sm '> Password </label>
            <input
              type="password"
              name="password"
              value={userPayload.password}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-100 focus:outline-none focus:border-gray-400 text-sm"
            />
          </div>

        </div>

        <button
          type="submit"
          className="w-full my-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 cursor-pointer transition"
        >
          Log in
        </button>

        <span className='text-right '>
          Don't have an account? <Link className='text-blue-600 font-bold ' to={'/register'}> Register </Link>
        </span>

      </form>

    </div>
  )
}
