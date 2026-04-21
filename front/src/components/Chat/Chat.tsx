import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GetConversationIdEndpoint, UpdateConversationEndpoint, type UpdateConversationPayload } from '../../api/endpoints/conversation'
import { GetMessagesEndpoint, SendMessagesEndpoint, type SendMessagePayload } from '../../api/endpoints/message'
import { useAuth } from '../../store/useAuth'

import { socket } from '../../socket/socket'
import type { MessageType } from '../../api/endpoints/message'

import UserPfp from '../../assets/images/user-pfp.jpg'
import { FaUserPlus } from "react-icons/fa6";
import { MdModeEdit } from "react-icons/md";
import { FaUserFriends } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { showErrorToast, showSuccessToast } from '../../utils/toast'


interface TypingEvent {
  userId: string
  conversationId: string
}


const Chat = () => {
    
  const [sendMessagePayload, setSendMessagePayload] = useState({
    content: '',
    type: 'text'
  })
  const [groupName, setGroupName] = useState('')
  const [editGroupPopup, setEditGroupPopup] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  const { id } = useParams()
  const user = useAuth((store) => store.user)
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const { data: conversationData, isLoading: conversationLoading } = useQuery({
    queryKey: ['get-conversation', id],
    queryFn: () => GetConversationIdEndpoint(id as string),
    enabled: Boolean(id)
  })

  const { data: messageData, isLoading: messageLoading } = useQuery({
    queryKey: ['get-messages', id],
    queryFn: () => GetMessagesEndpoint(id as string),
    enabled: Boolean(id)
  })

  const conversation = conversationData?.conversation
  const messages = messageData?.messages || []
  const isLoading = conversationLoading || messageLoading

  const currentUser = user?.id
  const otherUser = conversation?.participants.find((user) => user.id !== currentUser)
  const chatTitle = conversation?.isGroup ? conversation.groupName : otherUser?.username

  const sendMessageMutation = useMutation({
    mutationKey: ['send-message'],
    mutationFn: ({ payload, id }: { payload: SendMessagePayload; id: string }) => SendMessagesEndpoint(payload, id),
    onSuccess: () => {
      setSendMessagePayload({
        content: '',
        type: 'text'
      })
    },
    onError: (err: any) => {
      showErrorToast(err?.response?.data?.message || 'Message could not be delivered')
    }
  })

  const updateConversationMutation = useMutation({
    mutationKey: ['update-conversation'],
    mutationFn: (payload: UpdateConversationPayload) => UpdateConversationEndpoint(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['get-conversation'] })
      queryClient.invalidateQueries({ queryKey: ['get-conversations'] })
      
      showSuccessToast(data?.message || "Conversation updated!")
      setEditGroupPopup(false)
    },
    onError: (err: any) => {
      showErrorToast(err?.response?.data?.message || 'Update failed')
    }
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))

    const formData = new FormData()
    formData.append('groupAvatar', file)

    updateConversationMutation.mutate({
      id,
      formData
    })

  }

  const handleUpdateConversation = () => {
    const formData = new FormData()
    formData.append('groupName', groupName)

    updateConversationMutation.mutate({
      id,
      formData
    })
  }

  const handleSendMessage = (content: string, type: string) => {
    if (!id || !content.trim()) return

    emitTypingStop()

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    sendMessageMutation.mutate({
      id,
      payload: {
        content: content.trim(),
        type
      }
    })
  }

  useEffect(() => {
    if (!id) return
    
    if (!socket.connected) {
      socket.connect()
    }
  
    const handleConnect = () => {
      socket.emit('join_conversation', { conversationId: id })
    }

    const handleConnectError = (error: Error) => {
      console.error('Socket connection error:', error.message)
    }

    socket.emit('join_conversation', { conversationId: id })
  
    const handleNewMessage = (newMessage: MessageType) => {
      queryClient.setQueryData(['get-messages', id], (oldData: any) => {
        if (!oldData) return oldData
      
        return {
          ...oldData,
          messages: oldData.messages.some((message: MessageType) => message.id === newMessage.id)
            ? oldData.messages
            : [...oldData.messages, newMessage]
        }
      })
    }
  
    socket.on('connect', handleConnect)
    socket.on('connect_error', handleConnectError)
    socket.on('new_message', handleNewMessage)
  
    return () => {
      socket.off('connect', handleConnect)
      socket.off('connect_error', handleConnectError)
      socket.off('new_message', handleNewMessage)
    }
  }, [id, queryClient])

  
  // typing indicators
  const emitTypingStart = () => {
    if(!id || isTypingRef.current) return

    socket.emit('typing_start', { conversationId: id })
    isTypingRef.current = true
  }

  const emitTypingStop = () => {
    if(!id || !isTypingRef.current) return

    socket.emit('typing_stop', { conversationId: id })
    isTypingRef.current = false
  }

  // Listen for typing events from other users in the current conversation
  useEffect(() => {

    if(!id) return

    const handleTypingStart = (data: TypingEvent) => {
      if(data.conversationId !== id) return
      if(data.userId === currentUser) return

      setTypingUsers((prev) => {
        return prev.includes(data.userId) ? prev : [...prev, data.userId]
      })
    }
    
    const handleTypingStop = (data: TypingEvent) => {
      if (data.conversationId !== id) return

      setTypingUsers((prev) => prev.filter((userId) => userId !== data.userId))
    }


    socket.on('typing_start', handleTypingStart)
    socket.on('typing_stop', handleTypingStop)

    return () => {
      socket.off('typing_start', handleTypingStart)
      socket.off('typing_stop', handleTypingStop)
    }
  }, [id, currentUser])

  const isSomeoneTyping = typingUsers.length > 0


  // clear typing state after changing chats
  useEffect(() => {
    setTypingUsers([])
  }, [id])
  
  
  // automatically scroll to bottom on message send
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [id, messages.length])
  

  // if group username found fill the edit field
  useEffect(() => {

    if(conversation?.groupName){
      setGroupName(conversation.groupName || '')
    }

  }, [conversation, editGroupPopup])

  const convertDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // for avatars
  const otherParticipants = conversation?.participants.filter((participants) => participants.id !== currentUser)
  const groupPreviewAvatars = otherParticipants
    ?.slice(0, 2) || []

  const hasOtherOnlineUsers = conversation?.participants.some(
    (participant) => participant.id !== currentUser && participant.isOnline
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!conversation) {
    return <div>Select a conversation</div>
  }


  return (
    <section className='relative flex h-screen min-h-0 w-full flex-col overflow-hidden bg-[var(--outlet-color)] text-[#dbdee1]'>
      <header className='flex h-14 shrink-0 items-center gap-3 border-b border-[#1f2026] bg-[var(--outlet-color)] px-5 shadow-sm'>
        
        <div className='grid h-8 w-8 place-items-center rounded-full text-[15px] font-semibold text-[#b5bac1]'>
          {conversation?.isGroup ? (
            conversation.groupAvatar ? (
              <div className='relative '>
                <img
                  src={conversation.groupAvatar}
                  alt='Group profile'
                  className='h-8 w-8 rounded-full object-cover'
                />
                
                {hasOtherOnlineUsers && (
                  <span className={`w-3 h-3 rounded-full absolute -bottom-2 right-0 border-2 bg-[#23a55a] border-[#17181d] `} />
                )}
              </div>
            ) : (
            <div className='relative h-6 w-7'>
              {groupPreviewAvatars.map((participant, index) => (
                <div>
                  <img 
                    key={participant.id}
                    src={participant.avatar || UserPfp}
                    alt={`${participant.username} profile picture`}
                    className={`absolute rounded-full object-cover ${
                      index === 0
                        ? 'left-0 top-0 h-5 w-5 bg-[#5865f2]'
                        : 'left-2 top-2 h-5 w-5 border-2 border-[var(--outlet-color)]'
                    }`}
                  />
                  
                  {hasOtherOnlineUsers && (
                    <span className={`w-3 h-3 rounded-full absolute -bottom-2 right-0 border-2 bg-[#23a55a] border-[#17181d] `} />
                  )}
                </div>
              ))}
            </div>
            )
          ) : (
            <div className='relative '>
              <img
                src={otherUser?.avatar || UserPfp}
                alt='User profile picture'
                className='h-8 w-8 rounded-full object-cover'
              />
      
              <span className={`w-3 h-3 rounded-full absolute -bottom-0.5 right-0 border-2  ${otherUser?.isOnline ? "bg-[#23a55a] border-[#17181d]" : "bg-[#17181d] border-[#858585]"} `} />

            </div>
          )}
          
        </div>

        <div className='min-w-0'>
          <h1 className='truncate text-[16px] font-semibold text-white'>
            {chatTitle || 'Conversation'}
          </h1>

          {!conversation.isGroup && (
            <p className='truncate text-xs text-[#949ba4]'>
              Direct message
            </p>
          )}
        </div>
      </header>

      <div className='flex-1 overflow-y-auto py-5 [scrollbar-color:#1a1b20_transparent] [scrollbar-width:thin]'>
        
        {conversation?.isGroup ? (
          <div className='px-5 mb-4 pb-7 space-y-2 border-b border-[var(--border-color)] '>

            <div className='relative h-24 w-28 mb-4'>
              {conversation.groupAvatar ? (
                <div className='relative '>
                  <img
                    src={conversation?.groupAvatar}
                    alt='Group profile'
                    className='h-26 w-26 rounded-full object-cover'
                  />

                  {hasOtherOnlineUsers && (
                    <span className={`w-3 h-3 rounded-full absolute -bottom-2 right-0 border-2 bg-[#23a55a] border-[#17181d] `} />
                  )}
                </div>
              ) : (
                <div className="relative h-auto w-auto shrink-0 rounded-full ">
                  {groupPreviewAvatars.map((participant, index) => (
                    <div>
                      <img 
                        key={participant.id}
                        src={participant.avatar || UserPfp}
                        alt={`${participant.username} profile picture`}
                        className={`absolute rounded-full object-cover ${
                          index === 0
                            ? 'left-0 top-0 h-8 w-8 bg-[#5865f2]'
                            : 'left-2 top-2 h-8 w-8 border-2 border-[var(--outlet-color)]'
                        }`}
                      />

                      {hasOtherOnlineUsers && (
                        <span className={`w-3 h-3 rounded-full absolute -bottom-0 right-0.5 border-2 bg-[#23a55a] border-[#17181d] `} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <h1 className='text-3xl font-bold '> {conversation?.groupName} </h1>
            <p> This is the beginning of your direct message history with <span className='font-bold '> {conversation?.groupName} </span> </p>
          
            <div className='flex gap-2 my-2'>
              <button className='flex items-center gap-2 px-4 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] rounded-xl cursor-pointer '>
                <FaUserPlus />
                Invite friends 
              </button>

              <button onClick={() => setEditGroupPopup(true)} className='flex items-center gap-2 px-4 py-2 bg-[var(--background-secondary-color)] hover:bg-[var(--background-secondary-color-hover)] rounded-xl cursor-pointer '> 
                <MdModeEdit />
                Edit group 
              </button>
            </div>

            <span> {convertDate(conversation.createdAt)} </span>

          </div>
        ) : (
          <div className='px-5 my-4 pb-7 space-y-2 border-b border-[var(--border-color))] '>
            <img 
              src={otherUser?.avatar || UserPfp} 
              alt='User profile picture' 
              className='w-[75px] h-[75px] rounded-full ' 
            />

            <h1 className='text-3xl font-bold '> {otherUser?.username} </h1>

            <p> This is the beginning of your direct message history with <span className='font-bold '> {otherUser?.username} </span> </p>
          
            <span> {convertDate(conversation.createdAt)} </span>

          </div>
        )}

        <div className='space-y-1'>
          {messages.map((message) => {
            const isMine = message.sender.id === currentUser

            return (
              <div
                key={message.id}
                className={`group flex gap-3 rounded-[8px] py-2 transition hover:bg-[var(--background-hover)] ${isMine ? "justify-end " : ""} `}
              >
                <div className={`flex max-w-[70%] gap-4 rounded-[8px] px-5 py-2 text-[#f2f3f5] ${isMine ? "flex-row-reverse " : ""} `} >
                  
                  <img
                    src={message.sender.avatar}
                    alt={`${message.sender.username} avatar`}
                    className='h-9 w-9 mt-1 shrink-0 rounded-full object-cover'
                  />

                  <div className={`${isMine ? "text-right " : ""} `}>
                    {message.sender.username && (
                      <div className={`flex items-center gap-2 ${isMine ? "flex-row-reverse " : ""}  `}>
                        <p className='mb-1 text-md font-semibold text-[var(--text-color)]'>
                          {message.sender.username}
                        </p>

                        <p className='text-xs text-gray-500 mb-1 '>
                          {convertDate(message.createdAt)}
                        </p>
                      </div>
                    )}

                    <p className='break-words font-medium text-[15px] leading-5'>
                      {message.content}
                    </p>
                  </div>

                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div>
        {isSomeoneTyping && (
          <p className="text-sm text-gray-400 px-5 pb-2">
            {otherUser?.username} is typing...
          </p>
        )}
      </div>

      <footer className='shrink-0 bg-[var(--outlet-color)] px-5 pb-6 pt-3'>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage(sendMessagePayload.content, 'text')
          }}
          className='flex min-h-12 items-center rounded-[8px] bg-[#383a40] px-4'
        >
          <input 
            type='text'
            value={sendMessagePayload.content}
            onChange={(e) => {

              const value = e.target.value

              setSendMessagePayload((payload) => ({
                ...payload,
                content: value,
                type: 'text'
              }))

              if(value.trim()) {
                emitTypingStart()
              }else{
                emitTypingStop()
              }

              if(typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
              }

              typingTimeoutRef.current = setTimeout(() => {
                emitTypingStop()
              }, 1500)

            }}
            className='h-12 w-full bg-transparent text-[15px] text-[#f2f3f5] outline-none placeholder:text-[#949ba4]'
            placeholder={`Message @${chatTitle || 'conversation'}`}
          />

          <button
            type='submit'
            disabled={!sendMessagePayload.content.trim() || sendMessageMutation.isPending}
            className='ml-3 h-9 cursor-pointer rounded-[8px] bg-[#5865f2] px-4 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:bg-[#4a4d55] disabled:text-[#949ba4]'
          >
            Send
          </button>
        </form>
      </footer>

      {/* Popup for editing group */}
      
      {editGroupPopup && (
        <div onClick={() => setEditGroupPopup(false)} className='fixed inset-0 w-full h-full bg-black/55 flex justify-center items-center '>
          <div onClick={(e) => e.stopPropagation()} className='rounded-xl bg-[#252429] p-6 max-w-md w-full min-h-30 h-auto '>

            <div className='flex justify-between items-center '>
              <h1 className='text-xl font-bold '>Edit group</h1>
              <RxCross2 onClick={() => setEditGroupPopup(false)} className='text-2xl ' />
            </div>

            <label className='relative my-4 flex justify-center'>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            
              {conversation?.groupAvatar ? (
                <div className='relative group cursor-pointer w-30 h-30 bg-[#2e2d32] rounded-full flex items-center justify-center '>
                  <img src={conversation.groupAvatar} className="w-30 h-30 rounded-full object-cover" />
                  
                  <MdModeEdit className='absolute top-0 right-0 bg-[#2e2d32] w-8 h-8 p-1 rounded-full border-2 border-[var(--border-color)] ' />
                </div>
              ) : (
                <div className='relative group cursor-pointer w-30 h-30 bg-[#2e2d32] rounded-full flex items-center justify-center '>
                  <FaUserFriends className=' text-[54px] text-[#3f3e44] group-hover:text-[#56555b] ' />
                  <MdModeEdit className='absolute top-0 right-0 bg-[#2e2d32] w-8 h-8 p-1 rounded-full border-2 border-[var(--border-color)] ' />
                </div>
              )}
            </label>

            <div className='w-full '>
              <input 
                type='text' 
                name='groupName' 
                value={groupName} 
                onChange={(e) => setGroupName(e.target.value)} 
                className='w-full bg-[#201f24] border border-white/40 py-1.5 px-3 rounded-xl '
              />
            </div>

            <div className='flex justify-center gap-2 w-full mt-4'>
              <button onClick={() => setEditGroupPopup(false) } className='cursor-pointer w-full flex justify-center items-center py-2 bg-[#2e2d32] hover:bg-[#37363a] rounded-xl ' >Cancel</button>
              <button onClick={handleUpdateConversation} className='w-full flex justify-center items-center py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] rounded-xl cursor-pointer disabled:cursor-not-allowed' disabled={updateConversationMutation.isPending} > {updateConversationMutation.isPending ? "Loading..." : "Save"} </button>
            </div>

          </div>
        </div>
      )}

    </section>
  )
}

export default Chat
