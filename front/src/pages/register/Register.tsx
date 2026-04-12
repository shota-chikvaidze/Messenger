import { useState } from 'react'

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
        className="w-full max-w-sm bg-white px-6 py-12 rounded-2xl border border-gray-200"
      >
      
        {/* Title */}
        <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">
          Create account
        </h1>

        {/* Inputs */}
        <div className="flex flex-col gap-4">

          <input
            type="text"
            name="username"
            value={registerPaylod.username}
            onChange={handleChange}
            placeholder="Username"
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm"
          />

          <input
            type="email"
            name="email"
            value={registerPaylod.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm"
          />

          <input
            type="password"
            name="password"
            value={registerPaylod.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm"
          />

        </div>

        {/* Button */}
        <button
          type="submit"
          className="w-full mt-5 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
        >
          Register
        </button>

      </form>

    </div>
  )
}
