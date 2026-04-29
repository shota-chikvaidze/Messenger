import React, { useState, useEffect } from 'react'

import { UpdateConversationEndpoint, type UpdateConversationPayload, type ConversationType } from '../../api/endpoints/conversation'
import { useMutation,  useQueryClient } from '@tanstack/react-query'
import { showErrorToast, showSuccessToast } from '../../utils/toast'
import { MdModeEdit } from "react-icons/md";

import { FaUserFriends } from "react-icons/fa";
import { RxCross2 } from "react-icons/rx";


interface EditGroupPopupProps {
  conversation: ConversationType
  isOpen: boolean
  onClose: () => void
}

const EditGroupPopup = ({ conversation, isOpen, onClose }: EditGroupPopupProps) => {

  const [groupName, setGroupName] = useState('')  
  const queryClient = useQueryClient()
  const id = conversation.id

  const updateConversationMutation = useMutation({
    mutationKey: ['update-conversation'],
    mutationFn: (payload: UpdateConversationPayload) => UpdateConversationEndpoint(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['get-conversation'] })
      queryClient.invalidateQueries({ queryKey: ['get-conversations'] })
      
      showSuccessToast(data?.message || "Conversation updated!")
      onClose()
    },
    onError: (err: any) => {
      showErrorToast(err?.response?.data?.message || 'Update failed')
    }
  })

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

  useEffect(() => {
    if(conversation?.groupName){
      setGroupName(conversation.groupName || '')
    }
  }, [conversation, isOpen])


  return (
    isOpen && (
      <div onClick={onClose} className='fixed inset-0 w-full h-full bg-black/55 flex justify-center items-center '>
        <div onClick={(e) => e.stopPropagation()} className='rounded-xl bg-[#252429] p-6 max-w-md w-full min-h-30 h-auto '>

          <div className='flex justify-between items-center '>
            <h1 className='text-xl font-bold '>Edit group</h1>
            <RxCross2 onClick={onClose} className='text-2xl ' />
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
            <button onClick={onClose} className='cursor-pointer w-full flex justify-center items-center py-2 bg-[#2e2d32] hover:bg-[#37363a] rounded-xl ' >Cancel</button>
            <button onClick={handleUpdateConversation} className='w-full flex justify-center items-center py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-color-hover)] rounded-xl cursor-pointer disabled:cursor-not-allowed' disabled={updateConversationMutation.isPending} > {updateConversationMutation.isPending ? "Loading..." : "Save"} </button>
          </div>

        </div>
      </div>
    )
  )
}

export default EditGroupPopup