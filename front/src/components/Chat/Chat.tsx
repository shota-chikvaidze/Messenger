import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { EmojiProvider } from 'react-apple-emojis'
import emojiData from 'react-apple-emojis/src/data.json'

import { GetConversationIdEndpoint } from '../../api/endpoints/conversation'
import { GetMessagesEndpoint, type MessageType } from '../../api/endpoints/message'
import { GetFriendsEndpoint } from '../../api/endpoints/friends'
import { useAuth } from '../../store/useAuth'
import { socket } from '../../socket/socket'

import EditGroupPopup from '../chatComponents/EditGroupPopup'
import AddFriendPopup from '../chatComponents/AddFriendPopup'
import RightSidebar from '../chatComponents/RightSidebar'
import MessageComponent from '../chatComponents/MessageComponent'

import UserPfp from '../../assets/images/user-pfp.jpg'


const Chat = () => {

  // search state for adding/inviting friends on popup 
  const [search, setSearch] = useState('')

  const [addFriendPopup, setAddFriendPopup] = useState(false)
  const [editGroupPopup, setEditGroupPopup] = useState(false)

  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuth((store) => store.user)


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

        <MessageComponent 
          conversation={conversation} 
          isFriend={isFriend} 
          onInviteFriends={() => setAddFriendPopup(true)} 
          onEditGroup={() => setEditGroupPopup(true)} 
          messages={messages} 
          chatTitle={chatTitle}
          groupPreviewAvatars={groupPreviewAvatars}
        />

        <RightSidebar conversation={conversation} isFriend={isFriend} />

      </div>


      <EditGroupPopup conversation={conversation} isOpen={editGroupPopup} onClose={closeEditGroupPopup} />

      <AddFriendPopup conversation={conversation} friendsData={friendsData} isOpen={addFriendPopup} onClose={closeAddParticipantPopup} friendsLoading={friendsLoading}  />

    </section>
    </EmojiProvider>
  )
}

export default Chat
