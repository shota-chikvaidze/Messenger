import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginEndpoint, type LoginPayload } from '../../api/endpoints/auth'

import { useAuth } from '../../store/useAuth'
import { useMutation }  from '@tanstack/react-query'

import { showSuccessToast, showErrorToast } from '../../utils/toast'

import textImg from '../../assets/texting-image.webp'

export const Home = () => {

  const [userPayload, setUserPayload] = useState<LoginPayload>({
    email: '',
    password: ''
  })
  const setAuth = useAuth((s) => s.setAuth)
  const isInitialized = useAuth((state) => state.isInitialized)


  const user = useAuth((s) => s.user)

  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationKey: ['login-mutation'],
    mutationFn: (payload: LoginPayload) => LoginEndpoint(payload),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken)
      navigate('/find-friends')
      showSuccessToast(data.message)
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'შესვლა ვერ მოხერხდა')
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
    <section className='w-full h-screen flex justify-center items-center my-10 md:my-0 '>
      <div className='flex flex-col lg:flex-row md:items-center md:gap-4 h-auto  '>

        <div className='max-w-lg px-5 space-y-4 '>
          <div>
            
            <h1 className='text-xl md:text-2xl lg:text-3xl text-gray-600 '> Log in to Snapchat </h1>
            <p className='text-sm md:text-lg text-gray-600 '> Chat, Snap, and video call your friends. Watch Stories and Spotlight, all from your computer. </p>

          </div>

          {user && (
            <div>
              <button onClick={() => navigate('/find-friends')} className='bg-[var(--primary-color)] py-2 w-full text-white cursor-pointer mt-3 hover:bg-[var(--primary-color-hover)] '>
                Continue as {user.username}
              </button>
            </div>
          )}

          <form onSubmit={handleLoginMutation}>

            {!user && (
              <div className='space-y-1'>
                <input 
                  type='email' 
                  name='email' 
                  value={userPayload.email} 
                  onChange={handleChange} 
                  placeholder='Enter email'
                  className='bg-gray-100 p-2 w-full rounded ' 
                />

                <input 
                  type='password' 
                  name='password'
                  value={userPayload.password} 
                  onChange={handleChange} 
                  placeholder='Enter password' 
                  className='bg-gray-100 p-2 w-full rounded ' 
                />

                <button type='submit' className='bg-[var(--primary-color)] py-2 w-full text-white cursor-pointer mt-3 hover:bg-[var(--primary-color-hover)] '>
                  Login
                </button>

              </div>
            )}

            
          </form>

        </div>

        <div>
        
          <div className='max-w-lg mt-5 md:mt-0 lg:max-w-2xl px-3 space-y-2 '>
            <img 
              src={textImg} 
              width="1200"
              height="800" 
              alt='Texting image' 
            />
          </div>

        </div>

      </div>
    </section>
  )
}


{/*


  */}