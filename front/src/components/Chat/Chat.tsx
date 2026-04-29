import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Emoji, EmojiProvider } from 'react-apple-emojis'
import emojiData from 'react-apple-emojis/src/data.json'
import { GetConversationIdEndpoint } from '../../api/endpoints/conversation'
import { GetMessagesEndpoint, SendMessagesEndpoint, type SendMessagePayload, RemoveMessagesEndpoint, EditMessagesEndpoint, type EditMessagePayload } from '../../api/endpoints/message'
import { SendFriendReqEndpoint } from '../../api/endpoints/friends'

import { GetFriendsEndpoint } from '../../api/endpoints/friends'
import { useAuth } from '../../store/useAuth'

import { socket } from '../../socket/socket'
import type { MessageType } from '../../api/endpoints/message'

import UserPfp from '../../assets/images/user-pfp.jpg'
import { showErrorToast, showSuccessToast } from '../../utils/toast'
import { FaUserPlus } from "react-icons/fa6";
import { MdModeEdit, MdMoreHoriz, MdDeleteOutline, MdEdit } from "react-icons/md";
import { IoHappyOutline, IoPersonAddSharp, IoPersonRemoveSharp  } from "react-icons/io5";


import EditGroupPopup from '../chatComponents/EditGroupPopup'
import AddFriendPopup from '../chatComponents/AddFriendPopup'
import RightSidebar from '../chatComponents/RightSidebar'
import convertDate from '../../utils/convertDate'


interface TypingEvent {
  userId: string
  conversationId: string
}

const emojiOptions = [
  { name: 'grinning face', value: '😀' },
  { name: 'face with tears of joy', value: '😂' },
  { name: 'slightly smiling face', value: '🙂' },
  { name: 'smiling face with smiling eyes', value: '😊' },
  { name: 'smiling face with heart eyes', value: '😍' },
  { name: 'face blowing a kiss', value: '😘' },
  { name: 'thinking face', value: '🤔' },
  { name: 'face with rolling eyes', value: '🙄' },
  { name: 'crying face', value: '😢' },
  { name: 'loudly crying face', value: '😭' },
  { name: 'angry face', value: '😠' },
  { name: 'party popper', value: '🎉' },
  { name: 'red heart', value: '❤️' },
  { name: 'fire', value: '🔥' },
  { name: 'thumbs up', value: '👍' },
  { name: 'folded hands', value: '🙏' },
  { name: 'eyes', value: '👀' },
  { name: 'hundred points', value: '💯' },
  { name: 'sparkles', value: '✨' },
  { name: 'skull', value: '💀' }
]


const Chat = () => {
    
  const [sendMessagePayload, setSendMessagePayload] = useState({
    content: '',
    type: 'text'
  })

  const [editMessage, setEditMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editGroupPopup, setEditGroupPopup] = useState(false)

  // search state for adding/inviting friends on popup 
  const [search, setSearch] = useState('')

  const [addFriendPopup, setAddFriendPopup] = useState(false)
  const [emojiPopup, setEmojiPopup] = useState(false)

  // popup for editing/removing messages (on message hover)
  const [messageActionsPopup, setMessageActions] = useState<string | null>(null)

  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuth((store) => store.user)
  const queryClient = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messageInputRef = useRef<HTMLInputElement | null>(null)


  const { data: conversationData, isLoading: conversationLoading } = useQuery({
    queryKey: ['get-conversation', id],
    queryFn: () => GetConversationIdEndpoint(id as string),
    enabled: Boolean(id),
    retry: false,
  })

  const { data: messageData, isLoading: messageLoading } = useQuery({
    queryKey: ['get-messages', id],
    queryFn: () => GetMessagesEndpoint(id as string),
    enabled: Boolean(id),
    retry: false,
  })

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['get-friends', search],
    queryFn: () => GetFriendsEndpoint(search)
  })

  const conversation = conversationData?.conversation
  const messages = messageData?.messages || []
  const isLoading = conversationLoading || messageLoading


  const currentUser = user?.id
  const otherUser = conversation?.participants.find((user) => user.id !== currentUser)
  const chatTitle = conversation?.isGroup ? conversation.groupName : otherUser?.username
  const isFriend = friendsData?.some((friend) => friend.id === otherUser?.id)


  // for avatars
  const groupPreviewAvatars = conversation?.participants
    ? [...conversation.participants]
        .sort((first, second) => `${conversation.id}:${first.id}`.localeCompare(`${conversation.id}:${second.id}`))
        .slice(0, 2)
    : []

  const hasOtherOnlineUsers = conversation?.participants.some(
    (participant) => participant.id !== currentUser && participant.isOnline
  )

  // message handler if opened close else open
  const handleOpenMessagePopup = (id: string) => {
    setMessageActions((currentId) => currentId === id ? null : id)
  }


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

  const sendRequestMutation = useMutation({
    mutationKey: ['send-friend-request'],
    mutationFn: (id: string) => SendFriendReqEndpoint(id),
    onSuccess: (data) => {
      
      showSuccessToast(data?.message || "Friend request sent successfully")
      queryClient.invalidateQueries({ queryKey: ['get-users'] })

    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Failed to send friend request')
    }
  })

  const removeMessageMutation = useMutation({
    mutationKey: ['remove-message-mutation'],
    mutationFn: (id: string) => RemoveMessagesEndpoint(id),
    onSuccess: (data, messageId) => {
      socket.emit('remove_messages', {
        messageId,
        conversationId: id
      })
      
      showSuccessToast(data.message || 'Message removed')
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error Occurred')
    }
  })

  const editMessageMutation = useMutation({
    mutationKey: ['edit-message-mutation'],
    mutationFn: ({ payload, id }: {payload: EditMessagePayload, id: string}) => EditMessagesEndpoint(payload, id),
    onSuccess: (_, variables) => {
      socket.emit('edit_messages', {
        messageId: variables.id,
        content: variables.payload.content,
        conversationId: id
      })
      
      showSuccessToast('Message edited successfully')
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error Occurred')
    }
  })

  // edit message handler
  const handleEditMessage = (id: string) => {
    if (!editMessage.trim()) return

    editMessageMutation.mutate({
      id,
      payload: {
        content: editMessage
      }
    })

    setEditingMessageId(null)
  }

  // remove message handler
  const handleRemoveMessage = (id: string) => {
    removeMessageMutation.mutate(id)
  }

  // send friend request handler
  const handleFriendRequests = (id: string) => {
    sendRequestMutation.mutate(id)
  }

  const handleSendMessage = (content: string, type: string) => {
    if (!id || !content.trim()) return

    setEmojiPopup(false)
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



  const handleEmojiSelect = (emoji: string) => {
    setSendMessagePayload((payload) => ({
      ...payload,
      content: `${payload.content}${emoji}`,
      type: 'text'
    }))

    emitTypingStart()
    messageInputRef.current?.focus()
  }

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


  // close addParticipants popup if you have opened it from search params
  const closeAddParticipantPopup = () => {
    setAddFriendPopup(false)

    if (!searchParams.has('addParticipants')) return

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('addParticipants')
    setSearchParams(nextSearchParams, { replace: true })
  }


  // close editGroup popup if you have opened it from search params
  const closeEditGroupPopup = () => {
    setEditGroupPopup(false)

    if (!searchParams.has('editGroup')) return

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('editGroup')
    setSearchParams(nextSearchParams, { replace: true })
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
    
    const handleRemoveMessageSocket = ({ messageId }: { messageId: string }) => {
      queryClient.setQueryData(['get-messages', id], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          messages: oldData.messages.filter((msg: MessageType) => msg.id !== messageId)
        }
      })
    }
  
    const handleEditMessage = (updatedMessage: MessageType) => {
      queryClient.setQueryData(['get-messages', id], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          messages: oldData.messages.map((msg: MessageType) =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        }
      })
    }
  
    socket.on('connect', handleConnect)
    socket.on('connect_error', handleConnectError)
    socket.on('new_message', handleNewMessage)
    socket.on('edit_messages', handleEditMessage)
    socket.on('remove_messages', handleRemoveMessageSocket)
  
    return () => {
      socket.off('connect', handleConnect)
      socket.off('connect_error', handleConnectError)
      socket.off('new_message', handleNewMessage)
      socket.off('edit_messages', handleEditMessage)
      socket.off('remove_messages', handleRemoveMessageSocket)
    }
  }, [id, queryClient])


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
  

  // open edit group popup with searchParams
  useEffect(() => {
    if(searchParams.get('editGroup') === 'true' && conversation?.isGroup) {
      setEditGroupPopup(true)
    }
  }, [conversation?.isGroup, searchParams])


  // open add participant popup with searchParams
  useEffect(() => {
    if(searchParams.get('addParticipants') === 'true' && conversation?.isGroup) {
      setAddFriendPopup(true)
    }
  }, [conversation?.isGroup, searchParams])


  // when message actions popup is open and user clicks outside this useEffect makes popup close
  useEffect(() => {
    const handleClickOutside = () => {
      setMessageActions(null)
    }

    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])


  if (isLoading) {
    return <div className='text-white/80 '>Loading...</div>
  }


  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center ">
          <p className="text-xl font-medium text-neutral-400">No conversation selected</p>
          <p className="text-xs mt-1 text-neutral-500">Choose a chat to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <EmojiProvider data={emojiData}>
    <section className='relative flex h-screen min-h-0 w-full flex-col overflow-hidden bg-[var(--outlet-color)] text-[#dbdee1]'>
      
      <header className='absolute shrink-0 w-full flex items-center gap-10 h-14 border-b border-[#1f2026] bg-[var(--outlet-color)] px-5 shadow-sm'>
          
        <div className='flex items-center gap-3 '>
          <div className='grid h-8 w-8 place-items-center rounded-full text-[15px] font-semibold text-[#b5bac1]'>
            {conversation?.isGroup ? (
              conversation.groupAvatar ? (
                <div className='relative h-8 w-8 '>
                  <img
                    src={conversation.groupAvatar}
                    alt='Group profile'
                    className='h-8 w-8 rounded-full object-cover'
                  />

                  {hasOtherOnlineUsers && (
                    <span className={`w-3 h-3 rounded-full absolute -bottom-1 right-0 border-2 bg-[#23a55a] border-[#17181d] `} />
                  )}
                </div>
              ) : (
              <div className='relative h-8 w-8'>
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

                {hasOtherOnlineUsers && (
                  <span className={`w-3 h-3 rounded-full absolute right-0 bottom-0 border-2 bg-[#23a55a] border-[#17181d] `} />
                )}
              </div>
              )
            ) : (
              <div className='relative h-8 w-8 '>
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
        </div>

      </header>
        
      <div className='flex h-full pt-14 '>

        <div className='flex flex-col justify-between h-full flex-1 '>
          <div className='overflow-y-auto '>

            {/* messages header */}
            {conversation?.isGroup ? (
              <div className='px-5 py-6 space-y-2 border-b border-[var(--border-color)] '>
              
                <div className='h-24 w-28 mb-4'>
                  {conversation.groupAvatar ? (
                    <div className='relative h-24 w-28 '>
                      <img
                        src={conversation?.groupAvatar}
                        alt='Group profile'
                        className='h-26 w-26 rounded-full object-cover'
                      />
                    </div>
                  ) : (
                    <div className="relative h-24 w-28 shrink-0 rounded-full ">
                      {groupPreviewAvatars.map((participant, index) => (
                          <img 
                            key={participant.id}
                            src={participant.avatar || UserPfp}
                            alt={`${participant.username} profile picture`}
                            className={`absolute rounded-full object-cover ${
                              index === 0
                                ? 'left-0 top-0 h-16 w-16 bg-[#5865f2]'
                                : 'left-7 top-7 h-16 w-16 border-2 border-[var(--outlet-color)]'
                            }`}
                          />
                      ))}
                    </div>
                  )}
                </div>
                
                <h1 className='text-3xl font-bold '> {conversation?.groupName} </h1>
                <p> This is the beginning of your direct message history with <span className='font-bold '> {conversation?.groupName} </span> </p>
                
                <div className='flex gap-2 my-2'>
                  <button onClick={() => setAddFriendPopup(true)} className='flex items-center gap-2 px-4 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] rounded-xl cursor-pointer '>
                    <FaUserPlus />
                    Invite friends 
                  </button>
                
                  <button onClick={() => setEditGroupPopup(true)} className='flex items-center gap-2 px-4 py-2 border border-[#363638] bg-[#242328] hover:bg-[#2e2c32] rounded-xl cursor-pointer '> 
                    <MdModeEdit />
                    Edit group 
                  </button>
                </div>
                
                <p className='text-white/80 '>
                  Created: <span className='text-[#616165] text-sm  '> {convertDate(conversation.createdAt)} </span>
                </p>
                
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

                {!isFriend && otherUser && (
                  <div className='flex gap-2 my-2'>
                    <button onClick={() => handleFriendRequests(otherUser?.id)} className='flex items-center gap-2 px-4 py-2 border border-[#363638] bg-[#242328] hover:bg-[#2e2c32] rounded-xl cursor-pointer '> 
                      <MdModeEdit />
                      Add friend
                    </button>
                  </div>
                )}


                <span> {convertDate(conversation.createdAt)} </span>

              </div>
            )}

            {/* Messages */}
            <div className='h-auto relative  '>
              {messages.map((message) => (
                  <div key={message.id} className={`group relative flex gap-3 rounded-[8px] py-2 ${editingMessageId === message.id ? "bg-[var(--background-hover)]" : "hover:bg-[var(--background-hover)]"} transition  `}>

                    <div className={`flex items-start min-w-0 max-w-[90%] w-full gap-4 rounded-[8px] px-5 py-2 text-[#f2f3f5]  `} >
                      <img
                        src={message.sender.avatar}
                        alt={`${message.sender.username} avatar`}
                        className='h-9 w-9 mt-1 shrink-0 rounded-full object-cover'
                      />

                      <div className='w-full'>
                        {message.sender.username && (
                          <div className={`flex items-center gap-2`}>
                            <p className='mb-1 text-md font-semibold text-[var(--text-color)]'>
                              {message.sender.username}
                            </p>
                        
                            <p className='text-xs text-gray-500 mb-1 '>
                              {convertDate(message.createdAt)}
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <div className='break-all font-light text-[15px] text-white/90 leading-5'>

                            {editingMessageId === message.id ? (
                              <div>
                              
                                <textarea
                                  value={editMessage}
                                  autoFocus
                                  onChange={(e) => setEditMessage(e.target.value)} 
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleEditMessage(message.id)
                                      setEditingMessageId(null)
                                    }
                                    if (e.key === "Escape") {
                                      setEditingMessageId(null)
                                    }
                                  }}
                                  className="py-3 px-4 border break-all border-[#2f2f2f] w-full resize-none "
                                />

                                <div className="text-xs text-gray-400 mt-1">
                                  escape to cancel • enter to save
                                </div>
                              </div>

                            ) : (
                              message.content
                            )}
                          </div>

                          {message.sender.id !== otherUser?.id && (
                            <div className='absolute -top-3 right-10  '>

                              <div
                                className="relative"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MdMoreHoriz
                                  className={`bg-[var(--background-hover)] active:scale-90 shadow-md shadow-black/30 cursor-pointer w-9 h-9 p-2 rounded-lg transition
                                    ${messageActionsPopup === message.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                                  `}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenMessagePopup(message.id)
                                  }}
                                />
                                
                                {messageActionsPopup === message.id && (
                                  <div
                                    className="absolute right-full -top-1 mr-2 w-58 rounded-lg bg-[#2b2d31] shadow-lg p-2 z-50"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button 
                                      className="cursor-pointer active:scale-99 w-full flex items-center justify-between text-left px-3 py-2 text-sm text-red-400 hover:bg-white/10 rounded"
                                      onClick={() => handleRemoveMessage(message?.id)}
                                    >
                                      Remove message

                                      <MdDeleteOutline className='text-2xl ' />
                                    </button>

                                    <button 
                                      className="cursor-pointer active:scale-99 w-full flex items-center justify-between text-left px-3 py-2 text-sm text-[var(--text-color)] hover:bg-white/10 rounded"
                                      onClick={() => {
                                        setEditingMessageId(message.id)
                                        setEditMessage(message.content)
                                        setMessageActions(null)
                                      }}
                                    >
                                      Edit message

                                      <MdEdit className='text-2xl ' />
                                    </button>
                                  </div>
                                )}

                              </div>

                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                ))}

              <div ref={messagesEndRef} />

              <div>
                {isSomeoneTyping && (
                  <p className="text-sm text-gray-400 px-5 pb-2">
                    {conversation.isGroup ? (
                      (() => {
                        const names = typingUsers
                          .map(userId => conversation.participants.find(p => p.id === userId)?.username)
                          .filter(Boolean)
                        
                        if (names.length === 1) return `${names[0]} is typing...`
                        if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`
                        return 'Several people are typing...'
                      })()
                    ) : (
                      `${otherUser?.username} is typing...`
                    )}
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* input texting div */}
          <div className='shrink-0 w-full border-t border-[#1f2026] bg-[var(--outlet-color)] px-3 py-2'>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage(sendMessagePayload.content, 'text')
              }}
              className='flex min-h-[58px] items-center rounded-[8px] border border-[#30313a] bg-[#222327] px-5 shadow-sm shadow-black/20'
            >

              <input 
                ref={messageInputRef}
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
                className='h-12 min-w-0 flex-1 bg-transparent text-[16px] text-[#f2f3f5] outline-none placeholder:text-[#858895]'
                placeholder={`Message @${chatTitle || 'conversation'}`}
              />

              <div className='relative shrink-0'>
                <button
                  type='button'
                  onClick={() => setEmojiPopup((current) => !current)}
                  aria-label='Open emoji picker'
                  className='grid h-10 w-10 cursor-pointer place-items-center rounded-[8px] transition hover:bg-white/10 hover:text-white'
                >
                  <IoHappyOutline className='text-[22px]' />
                </button>

                {emojiPopup && (
                  <div className='absolute bottom-12 right-0 z-50 w-[278px] rounded-[8px] border border-[#30313a] bg-[#1f2027] p-3 shadow-2xl shadow-black/50'>
                    <div className='mb-2 text-xs font-semibold uppercase tracking-wide text-[#949ba4]'>
                      Emojis
                    </div>

                    <div className='grid grid-cols-5 gap-1'>
                      {emojiOptions.map((emoji) => (
                        <button
                          key={emoji.name}
                          type='button'
                          onClick={() => handleEmojiSelect(emoji.value)}
                          aria-label={`Add ${emoji.name}`}
                          className='grid h-10 w-10 cursor-pointer place-items-center rounded-[8px] transition hover:bg-[#31333b]'
                        >
                          <Emoji name={emoji.name} width={24} height={24} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </form>
          </div>
        </div>

        <RightSidebar conversation={conversation} isFriend={isFriend} />

      </div>


      <EditGroupPopup conversation={conversation} isOpen={editGroupPopup} onClose={closeEditGroupPopup} />

      <AddFriendPopup conversation={conversation} friendsData={friendsData} isOpen={addFriendPopup} onClose={closeAddParticipantPopup} friendsLoading={friendsLoading}  />

    </section>
    </EmojiProvider>
  )
}

export default Chat
