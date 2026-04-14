import React, { useState } from 'react'

import { UpdateAvatarEndpoint } from '../../api/endpoints/user'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showSuccessToast, showErrorToast } from '../../utils/toast'


export const Profile = () => {

  // const qc = useQueryClient()
  const [preview, setPreview] = React.useState<string | null>(null)


  const updatePfpMutation = useMutation({
    mutationKey: ['update-user-pfp'],
    mutationFn: (formData: FormData) => UpdateAvatarEndpoint(formData),
    onSuccess: (data) => {
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
    <div>
      <input 
        type="file" 
        accept="image/*"
        onChange={handleUpload}
      />

      {preview && <img src={preview} width={100} />}
    </div>
  )
}