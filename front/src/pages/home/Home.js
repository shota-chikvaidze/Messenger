import React from 'react'
import './Home.css'
import { Link } from 'react-router-dom'
import homeImage from '../../assets/images/messenger-converstions.png'

export const Home = () => {
  return (
    <>
      <section className='home_section'>
        <div className='home_container'>
          <div className='home_context'>
            <h1> A place for meaningful conversations</h1>
            <p>Messenger helps you connect with your Facebook friends and family, build your community, and deepen your interests.</p>
            <Link to={'/login'}>
              <button>Get Started</button>
            </Link>
          </div>
          <div className='home_conversation_image'>
            <img src={homeImage} alt='home messenger convversation image' />
          </div>
        </div>
      </section>  
    </>
  )
}
