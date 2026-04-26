import React, { useState } from 'react'

import { UpdateAvatarEndpoint } from '../../api/endpoints/user'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../store/useAuth'

import { showSuccessToast, showErrorToast } from '../../utils/toast'
import { MdModeEdit } from "react-icons/md"
import { FaUser } from "react-icons/fa"

export const Profile = () => {

  const [preview, setPreview] = React.useState<string | null>(null)
  const user = useAuth((store) => store.user)
  const setAuth = useAuth((store) => store.setAuth)

  const updatePfpMutation = useMutation({
    mutationKey: ['update-user-pfp'],
    mutationFn: (formData: FormData) => UpdateAvatarEndpoint(formData),
    onSuccess: (data) => {
      setAuth(data.user, '')
      showSuccessToast(data?.message)
    },
    onError: (err: any) => {
      showErrorToast(err?.response?.data?.message || 'Upload failed')
    }
  })


  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // preview
    setPreview(URL.createObjectURL(file))

    const formData = new FormData()
    formData.append('avatar', file)

    updatePfpMutation.mutate(formData)
  }

  return (
    <div className='flex flex-col items-center gap-6 p-8 text-[var(--text-color)]'>

      <div className='flex flex-col items-center gap-4'>
        <label className='relative cursor-pointer group'>

          <div className='w-24 h-24 rounded-full border border-[var(--border-color)] overflow-hidden bg-[#2b2d31] flex items-center justify-center'>

            {user?.avatar ? (
              <img src={user.avatar} className='w-full h-full object-cover' />
            ) : (
              <FaUser className='text-4xl text-[#4e5058]' />
            )}
            
          </div>

          <div className='absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#2b2d31] border border-[var(--border-color)] flex items-center justify-center group-hover:bg-[#35373c] transition'>
            <MdModeEdit className='text-sm text-[#b5bac1]' />
          </div>

          <input type='file' accept='image/*' hidden onChange={handleUpload} />
        </label>

        <div className='text-center'>
          <p className='text-[15px] font-semibold text-white'>Your profile</p>
          <p className='text-[13px] text-[#949ba4] mt-0.5'>Click avatar to change photo</p>
        </div>
      </div>

      {updatePfpMutation.isPending && (
        <p className='text-[13px] text-[#949ba4]'>Uploading...</p>
      )}

    </div>
  )
}