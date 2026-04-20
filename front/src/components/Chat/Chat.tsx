import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { GetConversationIdEndpoint } from '../../api/endpoints/conversation'
import { GetMessagesEndpoint, SendMessagesEndpoint, type SendMessagePayload } from '../../api/endpoints/message'
import { useAuth } from '../../store/useAuth'

import { useQueryClient } from '@tanstack/react-query'
import { socket } from '../../socket/socket'
import type { MessageType } from '../../api/endpoints/message'

import UserPfp from '../../assets/images/user-pfp.jpg'
import { FaUserPlus } from "react-icons/fa6";
import { MdModeEdit } from "react-icons/md";

const Chat = () => {
    
  const [sendMessagePayload, setSendMessagePayload] = useState({
    content: '',
    type: 'text'
  })
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
    }  
  })

  const handleSendMessage = (content: string, type: string) => {
    if (!id || !content.trim()) return

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

  // automatically scroll to bottom on message send
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [id, messages.length])

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


  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!conversation) {
    return <div>Select a conversation</div>
  }


  return (
    <section className='flex h-screen min-h-0 w-full flex-col overflow-hidden bg-[var(--outlet-color)] text-[#dbdee1]'>
      <header className='flex h-14 shrink-0 items-center gap-3 border-b border-[#1f2026] bg-[var(--outlet-color)] px-5 shadow-sm'>
        
        <div className='grid h-8 w-8 place-items-center rounded-full text-[15px] font-semibold text-[#b5bac1]'>
          {conversation?.isGroup ? (
            conversation.groupAvatar ? (
              <img
                src={conversation.groupAvatar}
                alt='Group profile'
                className='h-8 w-8 rounded-full object-cover'
              />
            ) : (
            <div className='relative h-6 w-7'>
              {groupPreviewAvatars.map((participant, index) => (
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
              ))}
            </div>
            )
          ) : (
            <img
              src={otherUser?.avatar || UserPfp}
              alt='User profile picture'
              className='h-8 w-8 rounded-full object-cover'
            />
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
          <div className='px-5 my-4 pb-7 space-y-2 border-b border-[var(--border-color))] '>
            <div className='relative h-24 w-28'>
              {groupPreviewAvatars.map((participant, index) => (
                <img 
                  key={participant.id}
                  src={participant.avatar || UserPfp}
                  alt={`${participant.username} profile picture`}
                  className={`absolute rounded-full object-cover shadow-lg ${
                    index === 0
                      ? 'left-0 top-0 h-16 w-16 bg-[#5865f2]'
                      : 'left-10 top-8 h-16 w-16 border-4 border-[var(--outlet-color)]'
                  }`}
                />
              ))}
            </div>

            <h1 className='text-3xl font-bold '> {conversation?.groupName} </h1>

            <p> This is the beginning of your direct message history with <span className='font-bold '> {conversation?.groupName} </span> </p>
          
            <div className='flex gap-2 my-2'>
              <button className='flex items-center gap-2 px-4 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] rounded-xl cursor-pointer '>
                <FaUserPlus />
                Invite friends 
              </button>
              <button className='flex items-center gap-2 px-4 py-2 bg-[var(--background-secondary-color)] hover:bg-[var(--background-secondary-color-hover)] rounded-xl cursor-pointer '> 
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
                className={`group flex gap-3 rounded-[8px] py-2 transition hover:bg-[var(--background-hover)]`}
              >
                <div className={`flex max-w-[70%] gap-3 rounded-[8px] px-5 py-2 text-[#f2f3f5] `} >
                  
                  <img
                    src={message.sender.avatar}
                    alt={`${message.sender.username} avatar`}
                    className='h-9 w-9 shrink-0 rounded-full object-cover'
                  />

                  <div>
                    {message.sender.username && (
                      <div className='flex items-center gap-1 '>
                        <p className='mb-1 text-md font-semibold text-[var(--text-color)]'>
                          {message.sender.username}
                        </p>

                        <p className='text-xs text-gray-300 mb-1 '>
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
            onChange={(e) => setSendMessagePayload((payload) => ({
              ...payload,
              content: e.target.value,
              type: 'text'
            }))}
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

    </section>
  )
}

export default Chat
