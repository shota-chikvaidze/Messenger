import React, { useState } from 'react'

import { type ConversationType } from '../../api/endpoints/conversation'
import { IoPersonAddSharp, IoPersonRemoveSharp  } from "react-icons/io5";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RemoveFriendEndpoint, SendFriendReqEndpoint } from '../../api/endpoints/friends'


import convertDate from '../../utils/convertDate'
import UserPfp from '../../assets/images/user-pfp.jpg'
import { useAuth } from '../../store/useAuth';
import { showErrorToast, showSuccessToast } from '../../utils/toast'

interface RightSidebarProps {
  conversation: ConversationType
  isFriend: boolean | undefined
}

const RightSidebar = ({ conversation, isFriend }: RightSidebarProps) => {

  const queryClient = useQueryClient()

  const user = useAuth((store) => store.user)
  const currentUser = user?.id
  const [sendRequestPopup, setSendRequestPopup] = useState(false)

  const otherUser = conversation?.participants.find((user) => user.id !== currentUser)

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

  // remove friend handler
  const handleRemoveFriend = (id: string) => {
    removeFriendMutation.mutate(id)
  }

  // send friend request handler
  const handleFriendRequests = (id: string) => {
    sendRequestMutation.mutate(id)
  }


  return (
    <div className='hidden shrink-0 border-l border-[var(--border-color)] xl:block'>
      {conversation.isGroup ? (
        <div className='h-full w-[260px] p-4 2xl:w-[280px]'>
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
        <div className="h-full w-[280px] bg-[#1e1c20] text-white shadow-md 2xl:w-[320px]">
        
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
  )
}

export default RightSidebar
