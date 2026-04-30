import { Link } from 'react-router-dom'
import textImg from '../../assets/images/texting-image.webp'
import messagesImage from '../../assets/images/messages-image.png'

export const Home = () => {
  return (
    <>

      <section className="w-full px-6 pt-5 ">
        <div className="w-full relative rounded-2xl overflow-hidden max-h-[80vh] ">

          <div className="absolute inset-0 bg-black/35 md:bg-black/15 rounded-3xl " />
          <img src={textImg} alt='Girl texting on phone' className='w-full h-[480px] md:h-auto object-cover  ' />

          <div className='absolute left-4 xs:left-18 md:left-36 top-1/2 -translate-y-1/2 space-y-4 max-w-[240px] xs:max-w-[350px] '>
            <h1 className='text-4xl text-white xs:text-5xl md:text-7xl '> Message <br /> privatly </h1>

            <p className=' text-white leading-5 md:text-md '> Simple, reliable, private messaging and calling for free*, available all over the world. </p>

            <Link to={'/login'}>
              <button className="cursor-pointer mt-8 transition-all bg-blue-500 text-white px-6 py-2 rounded-lg border-blue-600 border-b-[4px] hover:brightness-110 active:border-b-[2px] active:brightness-90 active:translate-y-[2px]">
                Log in
              </button>
            </Link>
          </div>

        </div>
      </section>

      <section className='w-full min-h-[500px] flex justify-center '>
        <div className='w-full max-w-7xl flex justify-around items-center py-10 '>

          <div className='space-y-6 '>
            <h1 className='max-w-sm text-6xl '> Keep in touch with your groups </h1>
            <p className='max-w-[400px] font-light leading-5 text-[18px] '> Whether it's planning an outing with friends or simply staying on top of your family chats, group conversations should feel effortless. </p>
          </div>

          <div>

            <img src={messagesImage} alt='Group messages' className='object-cover w-[370px] h-auto rounded-xl ' />

          </div>

        </div>
      </section>

    </>
  )
}