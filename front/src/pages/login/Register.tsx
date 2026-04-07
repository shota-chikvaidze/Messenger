import { useState } from 'react'

import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../../store/useAuth'
import { RegisterEndpoint, type RegisterPayload } from '../../api/endpoints/auth'


export const Register = () => {

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
    <div>
      
      <form onSubmit={handleRegisterMutation}>

        <div>
          Register
        </div>

        <div>

          <input 
            type='text' 
            name='username'
            value={registerPaylod.username} 
            onChange={handleChange} 
            placeholder='Enter username' 
          />

          <input 
            type='email' 
            name='email' 
            value={registerPaylod.email} 
            onChange={handleChange} 
            placeholder='Enter email' 
          />

          <input 
            type='password' 
            name='password'
            value={registerPaylod.password} 
            onChange={handleChange} 
            placeholder='Enter password' 
          />

        </div>

        <button type='submit'> Login </button>

      </form>

    </div>
  )
}
