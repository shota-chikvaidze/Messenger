import React, { useState, useEffect } from 'react'
import axios from '../../api/axios'
import { Outlet, Link, useNavigate, useParams } from 'react-router-dom'
import './UserDashboard.css'
import UseFriendsStore from '../../store/UseFriendsStore'

import { FiSearch } from "react-icons/fi";
import { IoPersonAddOutline } from "react-icons/io5";
import DefaultLogo from '../../assets/images/facebook-default-pfp.png'

export const UserDashboard = () => {

  const [ query, setQuery ] = useState('')
  const [ results, setResults ] = useState([])
  const { userFriends, fetchFriends } = UseFriendsStore()
  const [ loading, setLoading ] = useState(false)
  const { conversationId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])


  const searchFriends = async (q) => {
    try{

      const res = await axios.get(`/request/search-users?query=${q}`)
      setResults(res.data.users)

    }catch(err){
      console.error('error', err)
    }
  }

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)

    if (q.trim().length > 0) {
      searchFriends(q)
    } else {
      setResults([])
    }
  }

  const sendReq = async (id) => {
    try{

      const res = await axios.post('/request/send-request', {
        receiverId: id
      })
      alert('message sent')

    }catch(err){
      console.error('error', err)
    }
  }

  const startChat = async (chatId) => {
    try{

      setLoading(true)
      const res = await axios.post('/chat/chats', {
        receiverId: chatId
      })

      const conversationId = res.data.chat._id
      navigate(`/dashboard/chat/${conversationId}`)
      
      setLoading(false)

    }catch(err){
      console.error('error', err)
    }
  }

  const deleteChat = async (id) => {

    try{

      const res = await axios.delete(`/chat/chats/delete/${id}`)

    }catch(err){
      console.error('error', err)
    }
  }



  if(loading) return <p>Loading...</p>

  return (
    <>  
      <div className='friends_section_wrapper'>

        <section className='friends_section'>
          <div className='friends_container'>
            <div className='friends_title'>
              <h1>Chats</h1>
            </div>
            <div className='search_friends_wrapper'>
              <FiSearch className='search_icon'/>
              <input type='search' placeholder='Search Messenger' value={query} onChange={handleChange} />
            </div>

            {query.trim().length === 0 ? (

              <div>
                {userFriends.length === 0 ? (
                  <>
                    <p className='no_friends_para'>No friends found</p>
                  </>
                ) : (
                  <>
                    {userFriends.map((friend) => (
                      <div className='friend_req_item_left' key={friend._id} onClick={() => startChat(friend._id)}>
                        <img src={friend.avatarUrl || DefaultLogo} alt='user profile picture' />
                        <h3>{friend.name} {friend.lastname}</h3>
                        
                      </div>
                    ))}
                  </>
                )}
              </div>

            ) : (
              <>

                {results.length === 0 ? (
                  <>
                  <p className='search_res_text'>No search results</p>
                  </>
                ) : (
                  <>
                    {results.map((data) => (
                      <div key={data._id} className='searched_user'>
                        <img src={DefaultLogo} alt='user profile picture' />
                        <h3>{data.name} {data.lastname}</h3>
                        <IoPersonAddOutline onClick={() => sendReq(data._id)} className='send_req_icon' />
                      </div>
                    ))}
                  </>
                )}

              </>
            )}

          </div>
        </section>

        <Outlet />
        
      </div>
    </>
  )
}
