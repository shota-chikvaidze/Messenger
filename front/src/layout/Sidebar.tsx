import { useState } from 'react'

import { GetFriendsEndpoint } from '../api/endpoints/friends'
import { LogoutEndpoint } from '../api/endpoints/auth'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

import FriendsIcon from '../assets/icons/meeting.png'
import UserPfp from '../assets/images/user-pfp.jpg'
import { IoClose, IoSearch } from "react-icons/io5";
import { BsPersonRaisedHand } from "react-icons/bs";
import { GoGitPullRequest } from "react-icons/go";

import { CreateConvEndpoint, type CreateConversationPayload, GetConversationEndpoint } from '../api/endpoints/conversation'
import { showSuccessToast, showErrorToast } from '../utils/toast'

export const Sidebar = () => {

  const [addFriendPopup, setAddFriendPopup] = useState(false)
  const [conversationPayload, setConversationPayload] = useState<CreateConversationPayload>({
    participants: [], 
    groupName: ''
  })
  const [search, setSearch] = useState('')

  const user = useAuth((store) => store.user)

  const logoutMutation = useMutation({
    mutationKey: ['logout-mutation'],
    mutationFn: () => LogoutEndpoint(),
  })

  const handleLogout = () => {
    logoutMutation.mutate()
    useAuth.getState().clearAuth()
    showSuccessToast("Logged out successfully")
  }

  const { data: conversationData, isLoading: conversationLoading, refetch } = useQuery({
    queryKey: ['get-conversations'],
    queryFn: () => GetConversationEndpoint()
  })

  const conversations = conversationData?.conversations || []

  
  const currentUserId = user?.id
  const selectedFriendId = conversationPayload.participants.find((id) => id !== currentUserId)

  const createConvMutation = useMutation({
    mutationKey: ['create-conversation-mutation'],
    mutationFn: (payload: CreateConversationPayload) => CreateConvEndpoint(payload),
    onSuccess: (data) => {
      showSuccessToast(data.message || 'Conversation ready')
      refetch()
      setAddFriendPopup(false)
      setSearch('')
      setConversationPayload({
        participants: [],
        groupName: ''
      })
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error Occurred')
    }
  })

  const handleSubmit = () => {
    if (!currentUserId || !selectedFriendId) {
      showErrorToast('Choose a friend to start a conversation')
      return
    }

    createConvMutation.mutate(conversationPayload)
  }

  const handleFriendCheckbox = (friendId: string, username: string, checked: boolean) => {
    if (!currentUserId) {
      showErrorToast('Please sign in again to start a conversation')
      return
    }

    if (!checked) {
      setConversationPayload({
        participants: [],
        groupName: ''
      })
      return
    }

    setConversationPayload({
      participants: [currentUserId, friendId],
      groupName: username
    })
  }

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['get-friends', search],
    queryFn: () => GetFriendsEndpoint(search)
  })

  return (
    <div className='relative'>
      <aside className='min-w-[350px] w-auto h-screen  '>
          <div className='flex flex-col gap-4 h-full border px-3 border-[var(--border-color)] '>

            <div className='w-full space-y-3 border-b pb-4 border-[var(--border-color)] '>

              <div className='flex justify-between items-center pt-3 '>
                <div className="relative group">
                  <img 
                    src={user?.avatar || UserPfp}
                    alt="User profile picture"
                    className="w-9 h-9 rounded-full cursor-pointer object-cover "
                  />

                  <div className="absolute top-full  opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="w-40 mt-2 bg-[var(--background-color)] rounded-xl shadow-lg border border-[var(--border-color)] p-2 backdrop-blur-md">

                      <Link to={'/profile/edit'}>
                        <button className="w-full text-left px-3 py-2 rounded-lg text-sm text-white cursor-pointer bg-[var(--background-color)] hover:bg-[var(--background-hover)] transition">
                          Profile
                        </button>
                      </Link>

                      <button 
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 cursor-pointer hover:bg-[var(--background-hover)] transition"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>

                    </div>
                  </div>
                </div>

              </div>

              <div className='border-b border-[var(--border-color)]'>
                <button onClick={() => setAddFriendPopup(true)} className='cursor-pointer py-2 px-4 my-3 text-[var(--text-color)] rounded-lg flex justify-center items-center w-full bg-[var(--background-secondary-color)] hover:bg-[var(--background-hover)] '>
                  Start conversation
                </button>
              </div>

              <div className='space-y-0.5'>

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

            </div>

            <div className='h-full flex flex-col overflow-hidden'>

            {conversationLoading ? (
                <div className='flex justify-center '>
                  <p className='text-lg font-medium '>Loading...</p>
                </div>
              ) : (
                <>
                  {conversations?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
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
                      <div className='flex-1 overflow-y-auto'>

                        <div className='mb-2 '>
                          <p className='text-[var(--text-color)]/70 text-sm '> Direct messages </p>
                        </div>

                        {conversations?.map((friend) => {

                          const findUserAvatar = friend.participants.filter(user => user.id !== currentUserId)
                          const avatar = findUserAvatar.find(user => user)

                          return (
                            <div key={friend.id} className='flex items-center gap-4 py-2 w-full px-3 cursor-pointer hover:bg-[var(--background-hover)] rounded-lg '>
                              <img 
                                src={avatar?.avatar || friend?.groupAvatar || UserPfp} 
                                alt='User profile picture' 
                                className='w-10 h-10 rounded-full '
                              />
                              <p className='text-[var(--text-color)] '> {friend.groupName} </p>
                            </div>
                          )
                        })}
                      </div>
                  )}
                </>
              )}

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

            <div className='flex-1 overflow-y-auto px-3 py-3 [scrollbar-color:#6e707a_transparent] [scrollbar-width:thin]'>
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
                        checked={selectedFriendId === friend.id}
                        onChange={(e) => handleFriendCheckbox(friend.id, friend.username, e.target.checked)}
                        className='h-4 w-4 cursor-pointer accent-[#5865f2]'
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='flex items-center justify-between gap-3 border-t border-[#2a2b32] bg-[#14151a] px-5 py-4'>
              <p className='text-sm text-[#9da0a8]'>Start a new direct message</p>
              
              <button
                type='button'
                onClick={handleSubmit}
                disabled={!selectedFriendId || createConvMutation.isPending}
                className='h-10 cursor-pointer rounded-[8px] bg-[#5865f2] px-5 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:bg-[#363743] disabled:text-[#858894]'
              >
                {createConvMutation.isPending ? 'Starting...' : 'Start chat'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
