import React, { useState, useEffect } from 'react'

import { AddParticipantEndpoint, type AddParticipantPayload, type ConversationType } from '../../api/endpoints/conversation'
import { type Friend } from '../../api/endpoints/friends'

import { useMutation,  useQueryClient } from '@tanstack/react-query'
import { showErrorToast, showSuccessToast } from '../../utils/toast'

import { FaUserFriends } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";
import { FaUserPlus } from "react-icons/fa6";
import { MdModeEdit, MdMoreHoriz, MdDeleteOutline, MdEdit } from "react-icons/md";
import { IoClose, IoHappyOutline, IoSearch, IoPersonAddSharp, IoPersonRemoveSharp  } from "react-icons/io5";
import { BsPersonRaisedHand } from "react-icons/bs";
import UserPfp from '../../assets/images/user-pfp.jpg'
import { useAuth } from '../../store/useAuth'

interface AddFriendProps {
  conversation: ConversationType
  friendsLoading: boolean
  friendsData: Friend[] | undefined
  isOpen: boolean
  onClose: () => void
}

const AddFriendPopup = ({ conversation, friendsData, isOpen, friendsLoading, onClose }: AddFriendProps) => {

  const queryClient = useQueryClient()
  const id = conversation.id
  const user = useAuth((store) => store.user)
  const currentUser = user?.id
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([])
  const [search, setSearch] = useState('')

  // friends that are not in chat
  const participantIds = conversation?.participants.map(user => user.id) || []
  const friendsNotInChat = friendsData?.filter(
    (user) => !participantIds.includes(user.id)
  )


  const addParticipantMutation = useMutation({
    mutationKey: ['add-participant'],
    mutationFn: ({ id, payload }: { id: string; payload: AddParticipantPayload }) => AddParticipantEndpoint(id, payload),
    onSuccess: (data) => {
      onClose()
      setSelectedFriendIds([])
      queryClient.invalidateQueries({ queryKey: ['get-conversation'] })
      queryClient.invalidateQueries({ queryKey: ['get-conversations'] })
      showSuccessToast(data.message || 'Participant added')
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error Occurred')
    }
  })


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

    return (
    isOpen && (
        <div onClick={onClose} className='fixed inset-0 z-99 flex h-full w-full items-center justify-center bg-black/55 px-4 backdrop-blur-sm'>
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
                onClick={onClose}
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
      )
    )
}

export default AddFriendPopup