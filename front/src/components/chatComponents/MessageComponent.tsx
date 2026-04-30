import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Emoji } from 'react-apple-emojis'

import { useAuth } from '../../store/useAuth'
import { socket } from '../../socket/socket'

import { SendMessagesEndpoint, RemoveMessagesEndpoint, EditMessagesEndpoint, type EditMessagePayload, type MessageType, type SendMessagePayload } from '../../api/endpoints/message'
import { SendFriendReqEndpoint } from '../../api/endpoints/friends'
import { type ConversationType, type UserPreview } from '../../api/endpoints/conversation'

import convertDate from '../../utils/convertDate'
import emojiOptions from '../../utils/emoji'
import { showSuccessToast, showErrorToast } from '../../utils/toast'

import { MdModeEdit, MdMoreHoriz, MdDeleteOutline, MdEdit } from "react-icons/md";
import { IoHappyOutline } from "react-icons/io5";
import { FaUserPlus } from "react-icons/fa6";
import UserPfp from '../../assets/images/user-pfp.jpg'



interface TypingEvent {
  userId: string
  conversationId: string
}

interface MessageComponentProps {
  conversation: ConversationType,
  onInviteFriends: () => void,
  onEditGroup: () => void,
  isFriend: boolean | undefined,
  messages: MessageType[],
  chatTitle: string | undefined,
  groupPreviewAvatars: UserPreview[]
}


const MessageComponent = ({ conversation, onInviteFriends, isFriend, onEditGroup, messages, chatTitle, groupPreviewAvatars }: MessageComponentProps) => {

  const queryClient = useQueryClient()
  const [sendMessagePayload, setSendMessagePayload] = useState({
    content: '',
    type: 'text'
  })
  
  // popup for editing/removing messages (on message hover)
  const [messageActionsPopup, setMessageActions] = useState<string | null>(null)
  const [emojiPopup, setEmojiPopup] = useState(false)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [editMessage, setEditMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const isTypingRef = useRef(false)
  const messageInputRef = useRef<HTMLInputElement | null>(null)

  const user = useAuth((store) => store.user)
  const id = conversation.id
  const currentUser = user?.id
  const otherUser = conversation?.participants.find((user) => user.id !== currentUser)


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



  // send friend request handler
  const handleFriendRequests = (id: string) => {
    sendRequestMutation.mutate(id)
  }

  // remove message handler
  const handleRemoveMessage = (id: string) => {
    removeMessageMutation.mutate(id)
  }

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


  // message handler if opened close else open
  const handleOpenMessagePopup = (id: string) => {
    setMessageActions((currentId) => currentId === id ? null : id)
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

  const getTypingText = () => {
    if (!conversation.isGroup) return `${otherUser?.username} is typing...`

    const names = typingUsers
      .map(userId => conversation.participants.find(p => p.id === userId)?.username)
      .filter(Boolean)

    if (names.length === 1) return `${names[0]} is typing...`
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`
    return 'Several people are typing...'
  }


  // automatically scroll to bottom on message send
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [id, messages.length])


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



  return (
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
                  <button onClick={() => onInviteFriends()} className='flex items-center gap-2 px-4 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] rounded-xl cursor-pointer '>
                    <FaUserPlus />
                    Invite friends 
                  </button>
                
                  <button onClick={() => onEditGroup()} className='flex items-center gap-2 px-4 py-2 border border-[#363638] bg-[#242328] hover:bg-[#2e2c32] rounded-xl cursor-pointer '> 
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
                    {getTypingText()}
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
    )
  }

export default MessageComponent