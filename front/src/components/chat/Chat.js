import React, { useState, useEffect, use } from 'react'
import { useParams } from 'react-router-dom'
import './Chat.css'
import axios from '../../api/axios'
import socket from '../../socket'
import { useAuth } from '../../components/authProvider/AuthProvider'

import DefaultLogo from '../../assets/images/facebook-default-pfp.png'
import { IoSend } from "react-icons/io5";
import { PiGifFill } from "react-icons/pi";
import { MdOutlineEdit } from "react-icons/md";
import { MdDeleteOutline } from "react-icons/md";
import { PiDotsThreeCircleFill } from "react-icons/pi";
import { GoDotFill } from "react-icons/go";


const Chat = () => {

  const { conversationId } = useParams()
  const [friend, setFriend] = useState([])
  const [messages, setMessages] = useState([])
  const [postMessage, setPostMessage] = useState('')
  const [hovered, setHovered] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [userDet, setUserDet] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [userActive, setUserActive] = useState(false)
  const { user } = useAuth()

  const closeOpenUserDet = () => {
    if(userDet === false){
      setUserDet(true)
    }else{
      setUserDet(false)
    }
  }

  const fetchChatId = async () => {
    try{

      const res = await axios.get(`/chat/chats/${conversationId}`)
      setFriend(res.data.otherUser)
    
    }catch(err){
      console.error('error', err)
    }
  }

  const getMessages = async () => {
    try{

      const res = await axios.get(`/chat/chats/${conversationId}/messages`)
      setMessages(res.data)

    }catch(err){
      console.error('error', err)
    }
  }

  const sendMessage = () => {
    if(!postMessage.trim()) return

    const tempId = `temp-${Date.now()}`

    const messageData = {
      chatId: conversationId,
      senderId: user._id,
      receiverId: friend._id,
      content: postMessage,
      tempId
    }

    setMessages((prev) => [
      ...prev,
      { ...messageData, _id: tempId, sender: user, receiver: friend }
    ])

    socket.emit('sendMessage', messageData)
    setPostMessage('')

  }

  const deleteMessage = (id) => {
    socket.emit('deleteMessage', { messageId: id, userId: user._id })
  }

  const handleKeyDown = (e) => {
    if(e.key === 'Enter') return sendMessage()
  }


  useEffect(() => {
    fetchChatId()
    getMessages()
  }, [conversationId])

  useEffect(() => {

    socket.emit('user-online', user._id)

    socket.on('online-users', (users) => {
      setOnlineUsers(users)
    })    

    return () => {
      socket.off('online-users');
    }

  }, [user._id])

  useEffect(() => {
    setUserActive(onlineUsers.includes(friend._id))
  }, [onlineUsers, friend._id])

  useEffect(() => {
    if(!conversationId || !user) return

    socket.emit("joinRoom", conversationId)

    const handleReceive = (message) => {
      setMessages(prev => {
        if (message.tempId) {
          return prev.map(m =>
            m._id === message.tempId ? { ...message, _id: message._id } : m
          );
        }

        const exists = prev.find(m => m._id === message._id);
        if (exists) {
          return prev.map(m => (m._id === message._id ? message : m));
        }
      
        return [...prev, message];
      });
    };


    const handleDelete = ({ messageId, userId }) => {
      setMessages((prev) => 
        prev.map((msg) => 
          msg._id === messageId
            ? {
              ...msg,
              content: 'This message was deleted',
              deleted: true
            }
            : msg
        )
      )
    }

    const handleEdit = (updatedMessage) => {
      setMessages((prev) =>
        prev.map(msg =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    };

    socket.on('receiveMessage', handleReceive)
    socket.on('messageDeleted', handleDelete)
    socket.on('messageEdited', handleEdit)

    return () => {
      socket.emit('leaveChat', conversationId)
      socket.off('receiveMessage', handleReceive)
      socket.off('messageDeleted', handleDelete)
      socket.off('messageEdited', handleEdit)
    }

  }, [conversationId, user._id])


  return (
    <>
      <section className='chat_sect'>
        <div className='chat_wrapper'>

          <div className='chat_header'>
            <div className='chat_header_left'>
              <div className='user_pfp_wrapper'>
                <img src={DefaultLogo || friend.avatarUrl} className='image' />
                <span className='active_user'>
                  {userActive ? (
                    <GoDotFill  className='active_icon'/>
                  ) : (
                    ''
                  )}
                </span>
              </div>
              <div className='chat_user_bottom'>
                <h3>{ friend.name } { friend.lastname }</h3>
                <p> {userActive ? 'Active now' : ''} </p>
              </div>
            </div>
            <div className='chat_header_right'>
                <PiDotsThreeCircleFill onClick={closeOpenUserDet} className='user_pfp_details_icon' />
            </div>
          </div>

          <div className='message_section'>
            {messages && messages.map((msg) => {
              const isMine = (msg.sender._id || msg.sender) === user._id
              return (
                <div
                  key={msg._id}
                  className={`message_wrapper ${isMine ? 'mine' : 'friend'}`}
                  onMouseOver={() => setHovered(msg._id)} onMouseLeave={() => setHovered(null)}
                >
                  {!isMine && <span className='sender_name'>{msg.sender.name}</span>}
                  <div className='message_content' >                
                    <p> {msg.content} </p>

                    {hovered === msg._id && (
                      <div className='message_hover'>
                        <MdOutlineEdit className='hovered_message_icons' onClick={() => { setEditingId(msg._id); setEditingText(msg.content) }} />
                        <MdDeleteOutline className='hovered_message_icons' onClick={() => deleteMessage(msg._id)} />  
                      </div>
                    )}

                    {editingId === msg._id ? (
                      <>

                        <div className='edit_wrapper'>

                          <input 
                          type='text' 
                          placeholder='Edit message' 
                          value={editingText} 
                          onChange={(e) => setEditingText(e.target.value)} 
                          onKeyDown={(e) => {
                            if(e.key === "Enter") {
                              socket.emit('editMessage', {
                                messageId: msg._id, newText: editingText, userId: user._id
                              })
                              setEditingId(null)
                            }
                          }} 

                          />

                          <button onClick={() => {
                            socket.emit('editMessage', {
                              messageId: msg._id, newText: editingText, userId: user._id 
                            })
                            setEditingId(null)
                          }}>
                            Save
                          </button>

                        </div>

                      </>
                    ) : (
                      <>

                      </>
                    )}

                  </div>
                </div>
              );


            })}
          </div>


          <div className='send_message_wrapper'>

            <div className='send_message_left'>
              <PiGifFill className='gif_icon' />
            </div>

            <div className='send_message_right'>
              <input type='text' onKeyDown={handleKeyDown} placeholder='send a message' value={postMessage} onChange={(e) => setPostMessage(e.target.value)} />
              <IoSend onClick={handleKeyDown} className='send_icon' />
            </div>
          </div>

        </div>
      </section>
          
      

    </>
  )
}

export default Chat