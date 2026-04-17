import { useState } from 'react'

import { GetFriendsEndpoint } from '../api/endpoints/friends'
import { LogoutEndpoint } from '../api/endpoints/auth'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../store/useAuth'

import FriendsIcon from '../assets/icons/meeting.png'
import UserPfp from '../assets/images/user-pfp.jpg'
import { IoSearch } from "react-icons/io5";
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

  const createConvMutation = useMutation({
    mutationKey: ['create-conversation-mutation'],
    mutationFn: (payload: CreateConversationPayload) => CreateConvEndpoint(payload),
    onSuccess: (data) => {
      showSuccessToast(data.message)
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error Occurred')
    }
  })

  const handleSubmit = () => {
    createConvMutation.mutate(conversationPayload)
  }

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

                        {conversations?.map((friend) => (
                          <div key={friend._id} className='flex items-center gap-4 py-2 w-full px-3 cursor-pointer hover:bg-[var(--background-hover)] rounded-lg '>
                            <img 
                              src={friend?.groupAvatar || UserPfp} 
                              alt='User profile picture' 
                              className='w-10 h-10 rounded-full '
                            />
                            <p className='text-[var(--text-color)] '> {friend.groupName} </p>
                          </div>
                        ))}
                      </div>
                  )}
                </>
              )}

            </div>

          </div>
      </aside>

      {addFriendPopup && (
        <div onClick={() => setAddFriendPopup(false)} className='fixed inset-0 flex items-center justify-center backdrop-blur-md w-[100%] h-[100%] z-99 '>
          <div onClick={(e) => e.stopPropagation()} className='max-w-[380px] h-[100px] bg-white w-full '>

          </div>
        </div>
      )}

    </div>
  )
}
