import { Link } from 'react-router-dom'
import textImg from '../../assets/images/texting-image.webp'
import messagesImage from '../../assets/images/messages-image.png'
import conversationImage from '../../assets/images/conversation.png'

import { useAuth } from '../../store/useAuth'

export const Home = () => {

  const user = useAuth((store) => store.user)
  const isInitialized = useAuth((store) => store.isInitialized)

  return (
    <>

      <section className="w-full px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="w-full relative rounded-2xl overflow-hidden max-h-[80vh] ">

          <div className="absolute inset-0 bg-black/35 md:bg-black/15 rounded-3xl " />
          <img src={textImg} loading='eager' alt='Girl texting on phone' className='h-[440px] w-full object-cover sm:h-[480px] md:h-auto' />

          <div className='absolute left-4 top-1/2 max-w-[240px] -translate-y-1/2 space-y-4 xs:left-18 xs:max-w-[350px] md:left-36'>
            <h1 className='text-4xl text-white xs:text-5xl md:text-7xl'> Message <br /> privatly </h1>

            <p className=' text-white leading-5 md:text-md '> Simple, reliable, private messaging and calling for free*, available all over the world. </p>

            {isInitialized && !user && (
              <Link to={'/login'}>
                <button className="cursor-pointer mt-8 transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                  Log in
                </button>
              </Link>
            )}
            
          </div>

        </div>
      </section>

      <section className='flex min-h-[500px] w-full justify-center'>
        <div className='flex w-full max-w-6xl flex-col items-center justify-evenly gap-8 px-6 py-10 text-center md:flex-row md:text-left'>

          <div className='space-y-6 '>
            <h1 className='max-w-sm text-4xl xs:text-5xl md:text-6xl'> Keep in touch with your groups </h1>
            <p className='max-w-[400px] font-light text-[18px] '> Whether it's planning an outing with friends or simply staying on top of your family chats, group conversations should feel effortless. </p>
          </div>

          <div className='w-full max-w-[370px] md:w-auto'>

            <img src={messagesImage} loading='lazy' alt='Group messages' className='h-auto w-full rounded-xl object-cover md:w-[370px]' />

          </div>

        </div>
      </section>

      <section className='w-full flex justify-center my-10'>
        <div className='w-full max-w-6xl flex flex-col md:flex-row justify-evenly items-center gap-10 px-6 py-10'>
          
          <div className='w-full max-w-[420px] md:w-auto md:max-w-none'>
            <img
              src={conversationImage}
              className='w-full rounded-2xl object-cover md:w-auto'
              loading='lazy'
              alt='Messages image'
            />
          </div>
      
          <div className='min-w-0 space-y-6 md:min-w-fit'>
            <h1 className='w-full min-w-xs text-center text-3xl font-light leading-tight md:w-1/2 md:text-left md:text-4xl md:leading-14 lg:text-6xl'>
              Say what  you feel
            </h1>

            <p className='w-fit max-w-sm text-center text-lg md:w-sm md:text-left'> Express yourself without words. Use stickers or share everyday moments on Status. </p>
          </div>
                
        </div>
      </section>

    </>
  )
}
