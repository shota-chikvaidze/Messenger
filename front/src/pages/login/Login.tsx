import { useState } from 'react'
import { LoginEndpoint, type LoginPayload } from '../../api/endpoints/auth'

import { useAuth } from '../../store/useAuth'
import { useMutation }  from '@tanstack/react-query'


export const Login = () => {

  const [userPayload, setUserPayload] = useState<LoginPayload>({
    email: '',
    password: ''
  })
  const setAuth = useAuth((s) => s.setAuth)

  const loginMutation = useMutation({
    mutationKey: ['login-mutation'],
    mutationFn: (payload: LoginPayload) => LoginEndpoint(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
    }
  })

  const handleLoginMutation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    loginMutation.mutate(userPayload)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserPayload({...userPayload, [e.target.name]: e.target.value})
  }

  return (
    <div>
      
      <form onSubmit={handleLoginMutation}>

        <div>
          Login
        </div>

        <div>
          <input 
            type='email' 
            name='email' 
            value={userPayload.email} 
            onChange={handleChange} 
            placeholder='Enter email' 
          />

          <input 
            type='password' 
            name='password'
            value={userPayload.password} 
            onChange={handleChange} 
            placeholder='Enter password' 
          />
        </div>

        <button type='submit'> Login </button>

      </form>

    </div>
  )
}
