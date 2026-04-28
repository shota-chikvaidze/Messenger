import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Emoji, EmojiProvider } from 'react-apple-emojis'
import emojiData from 'react-apple-emojis/src/data.json'
import { GetConversationIdEndpoint, UpdateConversationEndpoint, type UpdateConversationPayload, AddParticipantEndpoint, type AddParticipantPayload } from '../../api/endpoints/conversation'
import { GetMessagesEndpoint, SendMessagesEndpoint, type SendMessagePayload, RemoveMessagesEndpoint, EditMessagesEndpoint, type EditMessagePayload } from '../../api/endpoints/message'
import { RemoveFriendEndpoint, SendFriendReqEndpoint } from '../../api/endpoints/friends'

import { GetFriendsEndpoint } from '../../api/endpoints/friends'
import { useAuth } from '../../store/useAuth'

import { socket } from '../../socket/socket'
import type { MessageType } from '../../api/endpoints/message'

import UserPfp from '../../assets/images/user-pfp.jpg'
import { showErrorToast, showSuccessToast } from '../../utils/toast'
import { FaUserPlus } from "react-icons/fa6";
import { MdModeEdit, MdMoreHoriz, MdDeleteOutline, MdEdit } from "react-icons/md";
import { FaUserFriends } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { IoClose, IoHappyOutline, IoSearch, IoPersonAddSharp, IoPersonRemoveSharp  } from "react-icons/io5";
import { BsPersonRaisedHand } from "react-icons/bs";


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
  const [groupName, setGroupName] = useState('')

  const [editMessage, setEditMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)

  // search state for adding/inviting friends on popup 
  const [search, setSearch] = useState('')

  // for adding participants
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
  
  const [editGroupPopup, setEditGroupPopup] = useState(false)
  const [addFriendPopup, setAddFriendPopup] = useState(false)
  const [sendRequestPopup, setSendRequestPopup] = useState(false)
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


  // friends that are not in chat
  const participantIds = conversation?.participants.map(user => user.id) || []
  const friendsNotInChat = friendsData?.filter(
    (user) => !participantIds.includes(user.id)
  )

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

  const updateConversationMutation = useMutation({
    mutationKey: ['update-conversation'],
    mutationFn: (payload: UpdateConversationPayload) => UpdateConversationEndpoint(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['get-conversation'] })
      queryClient.invalidateQueries({ queryKey: ['get-conversations'] })
      
      showSuccessToast(data?.message || "Conversation updated!")
      closeEditGroupPopup()
    },
    onError: (err: any) => {
      showErrorToast(err?.response?.data?.message || 'Update failed')
    }
  })

  const sendRequestMutation = useMutation({
    mutationKey: ['send-friend-request'],
    mutationFn: (id: string) => SendFriendReqEndpoint(id),
    onSuccess: (data) => {
      
      setSendRequestPopup(false)
      showSuccessToast(data?.message || "Friend request sent successfully")
      queryClient.invalidateQueries({ queryKey: ['get-users'] })

    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Failed to send friend request')
    }
  })

  const removeFriendMutation = useMutation({
    mutationKey: ['remove-friend-mutation'],
    mutationFn: (id: string) => RemoveFriendEndpoint(id),
    onSuccess: (data) => {
      setSendRequestPopup(false)
      showSuccessToast(data.message || 'Removed friend successfully!')
      setSendRequestPopup(false)
      queryClient.invalidateQueries({ queryKey: ['get-friends'] })
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error Occurred')
    }
  })

  const addParticipantMutation = useMutation({
    mutationKey: ['add-participant'],
    mutationFn: ({ id, payload }: { id: string; payload: AddParticipantPayload }) => AddParticipantEndpoint(id, payload),
    onSuccess: (data) => {
      setAddFriendPopup(false)
      setSelectedFriendIds([])
      queryClient.invalidateQueries({ queryKey: ['get-conversation'] })
      queryClient.invalidateQueries({ queryKey: ['get-conversations'] })
      showSuccessToast(data.message || 'Participant added')
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error Occurred')
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

  // remove friend handler
  const handleRemoveFriend = (id: string) => {
    removeFriendMutation.mutate(id)
  }

  // send friend request handler
  const handleFriendRequests = (id: string) => {
    sendRequestMutation.mutate(id)
  }

  // handling function for updating group conversations avatar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return

    const formData = new FormData()
    formData.append('groupAvatar', file)

    updateConversationMutation.mutate({
      id,
      formData
    })

  }
  const handleUpdateConversation = () => {
    if(!id) return

    const formData = new FormData()
    formData.append('groupName', groupName)

    updateConversationMutation.mutate({
      id,
      formData
    })
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

  // create direct or group conversations handler
  const handleAddParticipant = () => {
    
    if(!id){
      return
    }

    if (!currentUser) {
      showErrorToast('Please sign in again to start a conversation')
      return
    }

    if (selectedFriendIds.length === 0) {
      showErrorToast('Choose at least one friend')
      return
    }

    addParticipantMutation.mutate({
      id,
      payload: {
        userIds: selectedFriendIds
      }
    })

  }

  const handleFriendCheckbox = (friendId: string, checked: boolean) => {
    if (!currentUser) {
      showErrorToast('Please sign in again to start a conversation')
      return
    }

    if (checked) {
      setSelectedFriendIds((prev) => (
        prev.includes(friendId) ? prev : [...prev, friendId]
      ))
      return
    }

    setSelectedFriendIds((prev) => prev.filter((id) => id !== friendId))
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


  const convertDate = (date: string) => {
    if(!date) return

    return new Date(date).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // close editGroup popup if you have opened it from search params
  const closeEditGroupPopup = () => {
    setEditGroupPopup(false)

    if (!searchParams.has('editGroup')) return

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('editGroup')
    setSearchParams(nextSearchParams, { replace: true })
  }

  // close addParticipants popup if you have opened it from search params
  const closeAddParticipantPopup = () => {
    setAddFriendPopup(false)

    if (!searchParams.has('addParticipants')) return

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete('addParticipants')
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
    
    const handleRemoveMessage = ({ messageId }: { messageId: string }) => {
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
    socket.on('remove_messages', handleRemoveMessage)
  
    return () => {
      socket.off('connect', handleConnect)
      socket.off('connect_error', handleConnectError)
      socket.off('new_message', handleNewMessage)
      socket.off('edit_messages', handleEditMessage)
      socket.off('remove_messages', handleRemoveMessage)
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
  

  // if group username found fill the edit field
  useEffect(() => {
    if(conversation?.groupName){
      setGroupName(conversation.groupName || '')
    }
  }, [conversation, editGroupPopup])
  

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

        {/* right sidebar */}
        <div className=' border-l border-[var(--border-color)]  '>
          {conversation.isGroup ? (
            <div className='p-4 w-[280px] h-full '>
              <h2 className='text-gray-400 text-sm mb-2 '> Members: {conversation.participants.length} </h2>

              <div className='space-y-3 '>
              
                {conversation.participants.map((participant) => (
                  <div className='flex items-center gap-2 ' key={participant.id}>

                    <div className='relative '>
                      <img className='w-10 h-10 rounded-full' src={participant.avatar || UserPfp} alt='User profile picture' />
                      
                      {participant?.isOnline && (
                        <span className={`w-3 h-3 rounded-full absolute -bottom-0 right-0 border-2 bg-[#23a55a] border-[#17181d] `} />
                      )}
                    </div>

                    <h5> {participant.username} </h5>

                  </div>
                ))}

              </div>

            </div>
          ) : (
            <div className="w-[320px] h-full bg-[#1e1c20] rounded-xl text-white shadow-md">

              <div className="relative w-full h-30 bg-black flex justify-end gap-3 p-3">

                <div>
                  {isFriend ? (
                    <div className='relative group '>
                      <IoPersonRemoveSharp onClick={() => setSendRequestPopup(prev => !prev)} className='w-8 h-8 p-2 hover:bg-white/10 rounded-md cursor-pointer ' />
                      
                      {sendRequestPopup && otherUser && (
                        <div className='absolute right-full top-1/2 z-50 -translate-y-1/2 '>
                          <button
                            className='whitespace-nowrap select-none mr-3 cursor-pointer rounded-[8px] border border-[#3a3b42] bg-[#25262d] hover:bg-[#2f3037] px-3.5 py-2 text-sm font-semibold text-[#f2f3f5] shadow-xl shadow-black/40'
                            onClick={() => handleRemoveFriend(otherUser?.id)}
                          >
                            Remove friend
                          </button>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className='relative group '>
                      <IoPersonAddSharp onClick={() => setSendRequestPopup(prev => !prev)} className='w-8 h-8 p-2 hover:bg-white/10 rounded-md cursor-pointer ' />

                      {sendRequestPopup && otherUser && (
                        <div className='absolute right-full top-1/2 z-50 -translate-y-1/2 '>
                          <button
                            className='whitespace-nowrap select-none mr-3 cursor-pointer rounded-[8px] border border-[#3a3b42] bg-[#25262d] hover:bg-[#2f3037] px-3.5 py-2 text-sm font-semibold text-[#f2f3f5] shadow-xl shadow-black/40'
                            onClick={() => handleFriendRequests(otherUser?.id)}
                          >
                            Add friend
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className='absolute -bottom-5 left-5 '>
                  <div className="relative border-0 w-18 h-18">
                    <img
                      src={otherUser?.avatar || UserPfp}
                      alt="User profile picture"
                      className="w-18 h-18 select-none rounded-full object-cover"
                      />

                    <span
                      className={`w-4 h-4 rounded-full absolute bottom-0 right-0 border-2 ${
                        otherUser?.isOnline
                          ? "bg-[#23a55a] border-[#1e1f22]"
                          : "bg-[#2b2d31] border-[#858585]"
                      }`}
                    />
                  </div>
                </div>
                
              </div>

              <div className='mt-4 p-4 space-y-2.5'>

                <div className='space-y-1 '>
                  <h1 className="text-lg font-semibold leading-none">
                    {otherUser?.username}
                  </h1>
                  <p className="text-sm text-gray-400">
                    @{otherUser?.username}
                  </p>
                </div>

                <div className="bg-[#2b2d31] rounded-lg p-3">
                  <h4 className="text-xs text-gray-400 uppercase tracking-wide">
                    Member Since
                  </h4>
                      
                  {otherUser?.createdAt && (
                    <p className="text-sm mt-1 font-medium">
                      {convertDate(otherUser?.createdAt)}
                    </p>
                  )}
                </div>

              </div>

              
            </div>
          )}
        </div>

      </div>


      {/* Popup for editing group */}
      {editGroupPopup && (
        <div onClick={closeEditGroupPopup} className='fixed inset-0 w-full h-full bg-black/55 flex justify-center items-center '>
          <div onClick={(e) => e.stopPropagation()} className='rounded-xl bg-[#252429] p-6 max-w-md w-full min-h-30 h-auto '>

            <div className='flex justify-between items-center '>
              <h1 className='text-xl font-bold '>Edit group</h1>
              <RxCross2 onClick={closeEditGroupPopup} className='text-2xl ' />
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
              <button onClick={closeEditGroupPopup} className='cursor-pointer w-full flex justify-center items-center py-2 bg-[#2e2d32] hover:bg-[#37363a] rounded-xl ' >Cancel</button>
              <button onClick={handleUpdateConversation} className='w-full flex justify-center items-center py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] rounded-xl cursor-pointer disabled:cursor-not-allowed' disabled={updateConversationMutation.isPending} > {updateConversationMutation.isPending ? "Loading..." : "Save"} </button>
            </div>

          </div>
        </div>
      )}

      {/* Popup for adding friends to the group */}
      {addFriendPopup && (
        <div onClick={closeAddParticipantPopup} className='fixed inset-0 z-99 flex h-full w-full items-center justify-center bg-black/55 px-4 backdrop-blur-sm'>
          <div onClick={(e) => e.stopPropagation()} className='flex max-h-[760px] min-h-[520px] w-full max-w-[520px] flex-col overflow-hidden rounded-[8px] border border-[#30313a] bg-[#17181d] shadow-2xl shadow-black/50'>

            <div className='flex items-start justify-between gap-4 border-b border-[#2a2b32] px-5 py-5'>
              <div>
                <h1 className='text-xl font-semibold leading-7 text-white'>Add friends</h1>
                <p className='mt-1 text-sm leading-5 text-[#a6a8b0]'>
                  Pick a friend and add them to chat.
                </p>
              </div>

              <button
                type='button'
                onClick={closeAddParticipantPopup}
                aria-label='Close start conversation popup'
                className='grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-[8px] text-[#b9bbc2] transition hover:bg-[#25262d] hover:text-white'
              >
                <IoClose className='text-[22px]' />
              </button>
            </div>

            <div className='border-b border-[#2a2b32] px-5 py-4'>
              <label className='relative block'>
                <IoSearch className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#b9bbc2]' />
                <input
                  type='search'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Search friends'
                  className='h-11 w-full rounded-[8px] border border-[#30313a] bg-[#111216] pl-11 pr-4 text-[15px] text-white outline-none transition placeholder:text-[#81848e] focus:border-[#5865f2]'
                />
              </label>
            </div>

            <div className='flex-1 overflow-y-auto px-3 py-3 '>
              {friendsLoading ? (
                <div className='flex h-full items-center justify-center'>
                  <p className='text-sm font-medium text-[#bfc1c8]'>Loading friends...</p>
                </div>
              ) : friendsData?.length === 0 ? (
                <div className='flex h-full flex-col items-center justify-center px-8 text-center'>

                  <div className='mb-4 grid h-14 w-14 place-items-center rounded-[8px] bg-[#202128]'>
                    <BsPersonRaisedHand className='text-[25px] text-[#a6a8b0]' />
                  </div>

                  <h2 className='text-base font-semibold text-white'>No friends found</h2>
                  <p className='mt-1 max-w-[260px] text-sm leading-5 text-[#9da0a8]'>
                    Try another search or add friends before starting a conversation.
                  </p>
                  
                </div>
              ) : (
                <div className='space-y-1'>
                  {friendsNotInChat?.map((friend) => (
                    <div
                      key={friend.id}
                      className='flex min-h-[64px] w-full cursor-pointer items-center justify-between gap-3 rounded-[8px] px-3 text-left transition hover:bg-[#22232a]'
                    >
                      <div className='flex min-w-0 items-center gap-3'>
                        
                        <div className='relative shrink-0'>
                          <img
                            src={friend.avatar || UserPfp}
                            alt={`${friend.username} profile picture`}
                            className='h-10 w-10 rounded-full object-cover'
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[3px] border-[#17181d] ${
                              friend.isOnline ? 'bg-[#23a55a]' : 'bg-[#17181d] ring-2 ring-[#8c8f99]'
                            }`}
                          />
                        </div>

                        <div className='min-w-0'>
                          <h3 className='truncate text-[15px] font-semibold text-white'>{friend.username}</h3>
                          <p className='text-[13px] text-[#9da0a8]'>{friend.isOnline ? 'Online' : 'Offline'}</p>
                        </div>
                      </div>

                      <input
                        type='checkbox'
                        value={friend.id}
                        checked={selectedFriendIds.includes(friend.id)}
                        onChange={(e) => handleFriendCheckbox(friend.id, e.target.checked)}
                        className='h-4 w-4 cursor-pointer accent-[#5865f2]'
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='flex items-center justify-between gap-3 border-t border-[#2a2b32] bg-[#14151a] px-5 py-4'>
              <p className='text-sm text-[#9da0a8]'>
                {selectedFriendIds.length === 0
                  ? 'Select friends'
                  : selectedFriendIds.length === 1
                    ? 'Start a direct message'
                    : `${selectedFriendIds.length} friends selected`}
              </p>
              
              <button
                type='button'
                onClick={handleAddParticipant}
                disabled={selectedFriendIds.length === 0 || addParticipantMutation.isPending}
                className='h-10 cursor-pointer rounded-[8px] bg-[#5865f2] px-5 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:bg-[#363743] disabled:text-[#858894]'
              >
                {addParticipantMutation.isPending
                  ? 'Adding...'
                  : selectedFriendIds.length > 1 ? 'Add friends' : 'Add friend'}
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
    </EmojiProvider>
  )
}

export default Chat
