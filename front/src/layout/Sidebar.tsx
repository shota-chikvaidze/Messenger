import { useEffect, useState } from 'react'

import { GetFriendsEndpoint } from '../api/endpoints/friends'
import { LogoutEndpoint } from '../api/endpoints/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

import FriendsIcon from '../assets/icons/meeting.png'
import UserPfp from '../assets/images/user-pfp.jpg'
import { IoClose, IoSearch } from "react-icons/io5";
import { BsGearFill, BsHeadphones, BsMicMuteFill, BsPersonRaisedHand } from "react-icons/bs";
import { GoGitPullRequest } from "react-icons/go";
import { FaUserPlus } from "react-icons/fa";

import { RemoveFriendEndpoint, SendFriendReqEndpoint } from '../api/endpoints/friends'
import { CreateConvEndpoint, type CreateConversationPayload, GetConversationEndpoint, CreateGroupConvEndpoint, type CreateGroupConversationPayload, LeaveGroupEndpoint } from '../api/endpoints/conversation'
import { showSuccessToast, showErrorToast } from '../utils/toast'
import { usePresenceUpdates } from '../hooks/usePresenceUpdates'

export const Sidebar = () => {
  usePresenceUpdates()

  const [addFriendPopup, setAddFriendPopup] = useState(false)
  const [conversationActions, setConversationActions] = useState<string | null>(null)
  // states for group creation
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')

  const [search, setSearch] = useState('')
  const user = useAuth((store) => store.user)
  const qc = useQueryClient()
  const navigate = useNavigate()


  const logoutMutation = useMutation({
    mutationKey: ['logout-mutation'],
    mutationFn: () => LogoutEndpoint(),
  })

  const { data: conversationData, isLoading: conversationLoading, refetch } = useQuery({
    queryKey: ['get-conversations'],
    queryFn: () => GetConversationEndpoint()
  })

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['get-friends', search],
    queryFn: () => GetFriendsEndpoint(search)
  })

  const handleLogout = () => {
    logoutMutation.mutate()
    useAuth.getState().clearAuth()
    showSuccessToast("Logged out successfully")
  }

  // conversations data
  const conversations = conversationData?.conversations || []

  
  const currentUserId = user?.id
  const hasSelectedFriends = selectedFriendIds.length > 0

  const resetConversationPopup = () => {
    refetch()
    setAddFriendPopup(false)
    setSearch('')
    setSelectedFriendIds([])
    setGroupName('')
  }

  const createConvMutation = useMutation({
    mutationKey: ['create-conversation-mutation'],
    mutationFn: (payload: CreateConversationPayload) => CreateConvEndpoint(payload),
    onSuccess: (data) => {
      showSuccessToast(data.message || 'Conversation ready')
      resetConversationPopup()
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error Occurred')
    }
  })

  const createGroupConvMutation = useMutation({
    mutationKey: ['create-group-conversation-mutation'],
    mutationFn: (payload: CreateGroupConversationPayload) => CreateGroupConvEndpoint(payload),
    onSuccess: (data) => {
      showSuccessToast(data.message || 'Conversation ready')
      resetConversationPopup()
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error Occurred')
    }
  })

  const removeFriendMutation = useMutation({
    mutationKey: ['remove-friend-mutation'],
    mutationFn: (id: string) => RemoveFriendEndpoint(id),
    onSuccess: (data) => {
      showSuccessToast(data.message || 'Removed friend successfully!')
      setConversationActions(null)
      qc.invalidateQueries({ queryKey: ['get-friends'] })
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error Occurred')
    }
  })

  const sendRequestMutation = useMutation({
    mutationKey: ['send-friend-request'],
    mutationFn: (id: string) => SendFriendReqEndpoint(id),
    onSuccess: (data) => {
      showSuccessToast(data?.message || "Friend request sent successfully")
      
      setTimeout(() => {
        setConversationActions(null)
      }, 500)
      
      qc.invalidateQueries({ queryKey: ['get-users'] })
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Failed to send friend request')
    }
  })

  const leaveConversationMutation = useMutation({
    mutationKey: ['leave-conversation'],
    mutationFn: (id: string) => LeaveGroupEndpoint(id),
    onSuccess: (data) => {

      qc.invalidateQueries({ queryKey: ['get-conversation'] })
      qc.invalidateQueries({ queryKey: ['get-conversations'] })

      navigate('/profile')
      showSuccessToast(data.message)
    }
  })

  const handleLeaveConversation = (id: string) => {
    if(!id) return

    leaveConversationMutation.mutate(id)
  }

  // send friend request handler
  const handleFriendRequests = (id: string) => {
    sendRequestMutation.mutate(id)
  }

  // remove friend handler
  const handleRemoveFriend = (id: string) => {
    removeFriendMutation.mutate(id)
  }
 
  // create direct or group conversations handler
  const handleSubmit = () => {
    if (!currentUserId) {
      showErrorToast('Please sign in again to start a conversation')
      return
    }

    if (selectedFriendIds.length === 0) {
      showErrorToast('Choose at least one friend')
      return
    }

    if(selectedFriendIds.length === 1) {
      const selectedFriend = friendsData?.find((friend) => friend.id === selectedFriendIds[0])

      createConvMutation.mutate({
        participants: [currentUserId, selectedFriendIds[0]],
        groupName: selectedFriend?.username || ''
      })

      return
    }

    if(!groupName.trim()) {
      showErrorToast('Enter a group name')
      return
    }

    createGroupConvMutation.mutate({
      name: groupName.trim(),
      participantIds: selectedFriendIds
    })

  }

  const handleFriendCheckbox = (friendId: string, checked: boolean) => {
    if (!currentUserId) {
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

  // function for closing popup
  useEffect(() => {
    if (!conversationActions) return

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (target.closest(`[data-more-popup-root="${conversationActions}"]`)) return

      setConversationActions(null)
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [conversationActions])

  const getGroupPreviewAvatars = (participants: typeof conversations[number]['participants'], conversationId: string) => {
    return [...participants]
      .sort((first, second) => `${conversationId}:${first.id}`.localeCompare(`${conversationId}:${second.id}`))
      .slice(0, 2)
  }

  // open or close conversation actions popup
  const togglePopup = (id: string) => {
    setConversationActions((currentId) =>  currentId === id ? null : id)
  }

  return (
    <div className='relative'>
      <aside className='min-w-[350px] w-auto h-screen'>
          <div className='relative flex h-full flex-col gap-4 overflow-hidden border border-[var(--border-color)] pb-20 pt-2'>

            <div className='w-full border-b border-[var(--border-color)] pb-2 px-3'>
              <div className='relative h-10 border-[var(--border-color)]'>
                <button 
                  onClick={() => setAddFriendPopup(true)} 
                  className='absolute flex w-full cursor-pointer items-center justify-center rounded-lg bg-[var(--background-secondary-color)] px-4 py-2 text-sm text-[var(--text-color)] hover:bg-[var(--background-hover)]'
                >
                  Find or Start conversation
                </button>
              </div>
            </div>

            <div className='min-h-0 flex-1 overflow-y-auto pr-1 '>

              <div className='space-y-0.5 border-b border-[var(--border-color)] pb-3 px-3'>

                <Link to={'/profile/friends'}>
                  <div className='flex items-center py-2 px-3 rounded-lg w-full hover:bg-[#2c2b30] cursor-pointer '>
                    <BsPersonRaisedHand className='text-md text-white/80 ' />
                    <h3 className='text-md text-white/80 ml-2 '> Friends </h3>
                  </div>
                </Link>

                <Link to={'/profile/find-friends'}>
                  <div className='flex items-center py-2 px-3 rounded-lg w-full hover:bg-[#2c2b30] cursor-pointer'>
                    <IoSearch className='text-md text-white/80 ' />
                    <h3 className='text-md text-white/80 ml-2 '> Add friends </h3>
                  </div>
                </Link>

                <Link to={'/profile/friend-requests'}>
                  <div className='flex items-center py-2 px-3 rounded-lg w-full hover:bg-[#2c2b30] cursor-pointer'>
                    <GoGitPullRequest className='text-md text-white/80 ' />
                    <h3 className='text-md text-white/80 ml-2 '> Friend requests </h3>
                  </div>
                </Link>
              </div>

              <div className='flex flex-col pt-4'>

            {conversationLoading ? (
                <div className='flex justify-center '>
                  <p className='text-lg font-medium text-white '>Loading...</p>
                </div>
              ) : (
                <>
                  {conversations?.length === 0 ? (
                    <div className="flex flex-col items-center pt-10 h-full text-center px-6">
                      <div className="rounded-2xl mb-4 shadow-sm">
                        <img 
                          src={FriendsIcon} 
                          alt="No friends" 
                          className="w-10 h-10 opacity-70" 
                        />
                      </div>

                      <h1 className="text-[var(--text-color)]/90 text-lg font-semibold">
                        No conversations found
                      </h1>

                      <p className="text-gray-400 text-sm mt-1 max-w-[280px]">
                        Create conversation and connect with people to start chatting.
                      </p>
                    </div>
                    ) : (
                      <div className='space-y-0.5 px-3'>

                        <div className='mb-2 '>
                          <p className='text-[var(--text-color)]/70 text-sm '> Direct messages </p>
                        </div>

                        {conversations?.map((friend) => {

                          // for displaying avatars
                          const findUserAvatar = friend.participants.filter(user => user.id !== currentUserId)
                          const avatar = findUserAvatar.find(user => user)

                          const otherUser = friend.participants.find(
                            user => user.id !== currentUserId
                          )
                          const isFriend = friendsData?.some(
                            (currentFriend) => currentFriend.id === otherUser?.id
                          )

                          const groupPreviewAvatars = getGroupPreviewAvatars(friend.participants, friend.id)
                          const hasOtherOnlineUsers = friend.participants.some(
                            (participant) => participant.id !== currentUserId && participant.isOnline
                          )


                          return (
                              <Link 
                                onContextMenu={(e) => {
                                  e.preventDefault()
                                  togglePopup(friend.id)
                                }}
                                key={friend.id} 
                                to={`/profile/chat/${friend.id}`}>

                                <div className='flex items-center gap-4  py-2 w-full relative px-3 cursor-pointer hover:bg-[var(--background-hover)] rounded-lg '>

                                  {friend.isGroup ? (
                                    friend.groupAvatar ? (
                                      <div className='relative '>
                                        <img
                                          src={friend?.groupAvatar}
                                          alt='Group profile'
                                          className='h-10 w-10 rounded-full object-cover'
                                        />

                                        {hasOtherOnlineUsers && (
                                          <span className={`w-3 h-3 rounded-full absolute -bottom-1 right-0 border-2 bg-[#23a55a] border-[#17181d] `} />
                                        )}
                                      </div>
                                    ) : (
                                      <div className="relative h-10 w-10 shrink-0 rounded-full ">
                                        {groupPreviewAvatars.map((participant, index) => (
                                          <div key={participant.id}>
                                            <img 
                                              key={participant.id}
                                              src={participant.avatar || UserPfp}
                                              alt={`${participant.username} profile picture`}
                                              className={`absolute rounded-full object-cover ${
                                                index === 0
                                                  ? 'left-0 top-0 h-7 w-7 bg-[#5865f2]'
                                                  : 'left-2 top-2 h-7 w-7 border-2 border-[var(--outlet-color)]'
                                              }`}
                                            />

                                            {hasOtherOnlineUsers && (
                                              <span className={`w-3 h-3 rounded-full absolute -bottom-0 right-0.5 border-2 bg-[#23a55a] border-[#17181d] `} />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )
                                  ) : (
                                    <div className='relative '>
                                      <img
                                        src={avatar?.avatar || UserPfp}
                                        alt='User profile picture'
                                        className='h-10 w-10 rounded-full object-cover'
                                      />

                                      <span className={`w-3 h-3 rounded-full absolute -bottom-0.5 right-0 border-2  ${avatar?.isOnline ? "bg-[#23a55a] border-[#17181d]" : "bg-[#17181d] border-[#858585]"} `} />

                                    </div>
                                  )}

                                  <p className='text-[var(--text-color)] '> {friend.isGroup ? friend.groupName : avatar?.username} </p>
                                  
                                  {conversationActions === friend.id && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      data-more-popup-root={friend.id}
                                      className="absolute top-1/2 right-10 z-50 w-[188px] p-[8px] bg-[#2b2d31] rounded-md shadow-lg border border-[var(--border-color)] overflow-hidden"
                                    >
                                      <div className="flex flex-col text-sm text-gray-200 space-y-1 ">

                                        {/* DIRECT MESSAGE */}
                                        {!friend.isGroup && otherUser?.id && (
                                          <>

                                            {isFriend ? (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.preventDefault()
                                                  handleRemoveFriend(otherUser.id)
                                                }}
                                                disabled={removeFriendMutation.isPending}
                                                className="flex w-full cursor-pointer items-center rounded-[6px] py-2 px-3 text-[14px] font-semibold text-[#ff6b6b] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                                              >
                                                Remove friend
                                              </button>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.preventDefault()
                                                  handleFriendRequests(otherUser.id)
                                                }}
                                                disabled={sendRequestMutation.isPending}
                                                className="flex w-full cursor-pointer items-center rounded-[6px] py-2 px-3 text-[14px] font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                                              >
                                                add friend
                                              </button>
                                            )}
                                            
                                          </>
                                        )}

                                        {/* GROUP */}
                                        {friend.isGroup && (
                                          <>
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                setConversationActions(null)
                                                navigate(`/profile/chat/${friend.id}?editGroup=true`)
                                              }}
                                              className="py-2 px-3 text-left cursor-pointer flex items-center w-full text-[14px] font-semibold rounded-[6px] hover:bg-white/10 transition-colors"
                                            >
                                              Edit Group
                                            </button>
                                        
                                            <button
                                              onClick={(e) => { handleLeaveConversation(friend.id); e.preventDefault() }}
                                              disabled={leaveConversationMutation.isPending}
                                              className="py-2 px-3 text-left cursor-pointer flex items-center w-full text-red-400 text-[14px] font-semibold rounded-[6px] hover:bg-white/10 transition-colors"
                                            >
                                              Leave Group
                                            </button>
                                          </>
                                        )}

                                      </div>
                                    </div>
                                  )}

                                </div>

                            </Link>
                            
                          )
                        })}
                      </div>
                  )}
                </>
              )}

              </div>
            </div>

            <div className='absolute bottom-2 left-2 right-2 flex h-[58px] items-center justify-between rounded-[8px] border border-[#30313a] bg-[#202127] shadow-lg shadow-black/20'>
              <Link to='/profile/edit' className='flex items-center min-w-0 w-full hover:bg-white/5 gap-3 rounded-[8px] px-4 py-2 transition '>
                <div className='relative shrink-0'>
                  <img
                    src={user?.avatar || UserPfp}
                    alt='User profile picture'
                    className='h-9 w-9 rounded-full object-cover'
                  />
                  <span className='absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-[#202127] bg-[#23a55a]' />
                </div>

                <div className='min-w-0'>
                  <p className='truncate text-[15px] font-semibold leading-5 text-white'>{user?.username || 'User'}</p>
                  <p className='text-[13px] leading-4 text-[#b5bac1]'> Online </p>
                </div>
              </Link>
            </div>

          </div>
      </aside>

      {addFriendPopup && (
        <div onClick={() => setAddFriendPopup(false)} className='fixed inset-0 z-99 flex h-full w-full items-center justify-center bg-black/55 px-4 backdrop-blur-sm'>
          <div onClick={(e) => e.stopPropagation()} className='flex max-h-[760px] min-h-[520px] w-full max-w-[520px] flex-col overflow-hidden rounded-[8px] border border-[#30313a] bg-[#17181d] shadow-2xl shadow-black/50'>

            <div className='flex items-start justify-between gap-4 border-b border-[#2a2b32] px-5 py-5'>
              <div>
                <h1 className='text-xl font-semibold leading-7 text-white'>Start conversation</h1>
                <p className='mt-1 text-sm leading-5 text-[#a6a8b0]'>
                  Pick a friend and open a new chat.
                </p>
              </div>

              <button
                type='button'
                onClick={() => setAddFriendPopup(false)}
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
                  {friendsData?.map((friend) => (
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

            {selectedFriendIds.length > 1 && (
              <div className='border-t border-[#2a2b32] px-5 py-4'>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  className='h-11 w-full rounded-[8px] border border-[#30313a] bg-[#111216] px-4 text-[15px] text-white outline-none transition placeholder:text-[#81848e] focus:border-[#5865f2]'
                />
              </div>
            )}

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
                onClick={handleSubmit}
                disabled={!hasSelectedFriends || createConvMutation.isPending || createGroupConvMutation.isPending}
                className='h-10 cursor-pointer rounded-[8px] bg-[#5865f2] px-5 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:bg-[#363743] disabled:text-[#858894]'
              >
                {createConvMutation.isPending || createGroupConvMutation.isPending
                  ? 'Starting...'
                  : selectedFriendIds.length > 1 ? 'Create group' : 'Start chat'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
