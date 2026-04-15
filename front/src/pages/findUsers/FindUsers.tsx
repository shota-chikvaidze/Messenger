// import { useState } from "react"

import { useMutation, useQuery } from '@tanstack/react-query'
import { GetUsersEndpoint } from '../../api/endpoints/user'
import { SendFriendReqEndpoint } from '../../api/endpoints/friends'
import { showErrorToast, showSuccessToast } from '../../utils/toast'

import UserPfp from '../../assets/images/user-pfp.jpg'

export const FindUsers = () => {
  
  const { data: usersData } = useQuery({
    queryKey: ['get-users'],
    queryFn: () => GetUsersEndpoint()
  })

  const users = usersData?.users || []


  const sendRequestMutation = useMutation({
    mutationKey: ['send-friend-request'],
    mutationFn: (id: string) => SendFriendReqEndpoint(id),
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
    <section className='w-full min-h-screen my-10 flex justify-center '>
      <div className='max-w-md w-full '>

        {users.length === 0 ? (
          <div>
          
          </div>
        ) : (
          <div className='w-full space-y-2 '>
            {users.map((user) => (

              <div key={user.id} className=' px-4 py-6 w-full flex gap-4 justify-center items-center border border-gray-200 rounded-lg  '>
                
                <div className='flex items-center rounded-full '>
                  <img src={user.avatar || UserPfp} alt='User profile picture' className='w-[105px] h-[80px] rounded-full ' />
                </div>

                <div className='w-full space-y-1'>
                  <p> {user.username} </p>
                  <button 
                    onClick={() => handleFriendRequests(user.id)} 
                    disabled={user.hasSentRequest === true}
                    className={` w-full py-2 px-4 rounded ${user.hasSentRequest ? "bg-gray-200 cursor-not-allowed text-black" : "bg-blue-400 hover:bg-blue-500 cursor-pointer text-white"} `}
                  > 
                    {user.hasSentRequest ? "Request already sent" : "Send friend request"}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  )
}
