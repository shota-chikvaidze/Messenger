import { useState } from "react"

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GetUsersEndpoint } from '../../api/endpoints/user'
import { SendFriendReqEndpoint } from '../../api/endpoints/friends'
import { showErrorToast, showSuccessToast } from '../../utils/toast'

import UserPfp from '../../assets/images/user-pfp.jpg'
import { AiOutlineUserAdd } from "react-icons/ai";
import { IoSearch } from "react-icons/io5";

export const FindUsers = () => {
  
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data: usersData } = useQuery({
    queryKey: ['get-users', search],
    queryFn: () => GetUsersEndpoint(search)
  })

  const users = usersData?.users || []


  const sendRequestMutation = useMutation({
    mutationKey: ['send-friend-request'],
    mutationFn: (id: string) => SendFriendReqEndpoint(id),
    onSuccess: (data) => {
      showSuccessToast(data?.message || "Friend request sent successfully")
      qc.invalidateQueries({ queryKey: ['get-users'] })
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Failed to send friend request')
    }
  })

  const handleFriendRequests = (id: string) => {
    sendRequestMutation.mutate(id)
  }

  return (
    <section className='w-full min-h-screen p-10 flex justify-center '>
      <div className='max-w-lg w-full flex flex-col items-start '>


          <div className="mb-6 w-full">
            <div className="pb-4 ">
              <h3 className="text-3xl text-gray-700 font-bold "> Find friends </h3>
              <p className="text-gray-500 "> Discover people you may know </p>
            </div>

            <input 
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="border border-gray-200 py-2 px-5 rounded-lg max-w-lg w-full "
            />
          </div>

          {users.length === 0 ? (
            <div className="flex items-center flex-col w-full mt-10 ">

              <IoSearch className="text-5xl text-gray-400 " />

              <h2 className="text-gray-600 "> No users found </h2>
              <p className="text-gray-500 text-sm font-[300] ">Try a different search term</p>

            </div>
          ) : (
            <div className='w-full space-y-2 '>
              {users.map((user) => (

                <div key={user.id} className='group px-2 py-3 w-full flex gap-4 justify-between items-center rounded-md hover:bg-[#EDF2FE]  '>

                  <div className='flex items-center rounded-full gap-3 '>
                    <img src={user.avatar || UserPfp} alt='User profile picture' className='border-2 border-transparent group-hover:border-blue-700 w-[60px] h-[60px] rounded-full ' />

                    <p> {user.username} </p>
                  </div>
                  
                  <button 
                    className={`group-hover:flex items-center gap-1 text-sm font-semibold justify-center hidden rounded-xl px-3 py-2 ${user.hasSentRequest ? "cursor-not-allowed bg-gray-400 text-white  " : "bg-blue-600 text-white hover:bg-blue-500 cursor-pointer "} `}
                    type="button"
                    onClick={() => handleFriendRequests(user.id)}
                    disabled={user.hasSentRequest}
                  >
                    <AiOutlineUserAdd className="text-md" /> 
                    {user.hasSentRequest ? "Sent" : "Add"}
                  </button>

                </div>
              ))}
            </div>
          )}


      </div>
    </section>
  )
}
