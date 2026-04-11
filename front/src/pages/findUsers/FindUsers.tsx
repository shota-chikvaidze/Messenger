// import { useState } from "react"

import { useMutation, useQuery } from '@tanstack/react-query'
import { GetUsersEndpoint } from '../../api/endpoints/user'
import { AcceptFriendReqEndpoint } from '../../api/endpoints/friends'
import { showErrorToast, showSuccessToast } from '../../utils/toast'

export const FindUsers = () => {
  
  const { data: usersData } = useQuery({
    queryKey: ['get-users'],
    queryFn: () => GetUsersEndpoint()
  })

  const users = usersData?.users || []


  const sendRequestMutation = useMutation({
    mutationKey: ['send-friend-request'],
    mutationFn: (id: string) => AcceptFriendReqEndpoint(id),
    onSuccess: (data) => {
      showSuccessToast(data?.message || "Friend request sent successfully")
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Failed to send friend request')
    }
  })

  const handleFriendRequests = (id: string) => {
    sendRequestMutation.mutate(id)
  }

  return (
    <div>

      {users.length === 0 ? (
        <div>
        
        </div>
      ) : (
        <div>
          {users.map((user) => (
            <div key={user._id}>
              
              <p> {user.username} </p>
              <button onClick={() => handleFriendRequests(user._id)}> Send friend request </button>

            </div>
          ))}
        </div>
      )}

    </div>
  )
}
