import { useState } from "react"

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { GetUsersEndpoint } from '../../api/endpoints/user'
import { SendFriendReqEndpoint, } from '../../api/endpoints/friends'
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
    <section className='flex h-full w-full overflow-y-auto p-4 sm:p-6 lg:p-10'>
      <div className='   w-full flex flex-col items-start '>


          <div className="mb-6 w-full">
            <div className="pb-4 ">
              <h3 className="text-2xl font-bold text-[var(--text-color)] sm:text-3xl"> Find friends </h3>
              <p className="text-[var(--text-color)]/70 "> Discover people you may know </p>
            </div>

            <label className="relative block">
              <IoSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#b9bbc2]" />
              <input 
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-11 w-full rounded-[8px] border border-[#30313a] bg-[#111216] pl-11 pr-4 text-[var(--text-color)] outline-none transition placeholder:text-[#81848e] focus:border-[#5865f2]"
              />
            </label>
          </div>

          {users.length === 0 ? (
            <div className="flex flex-1 items-center flex-col w-full mt-10 ">

              <IoSearch className="text-5xl text-gray-400 " />

              <h2 className="text-gray-200 "> No users found </h2>
              <p className="text-gray-400 text-sm font-[300] ">Try a different search term</p>

            </div>
          ) : (
            <div className='w-full space-y-2 '>
              {users.map((user) => (

                <div key={user.id} className='group flex w-full items-center justify-between gap-3 rounded-md px-2 py-3 hover:bg-[var(--background-hover)] sm:gap-4'>

                  <div className='flex min-w-0 items-center gap-3 rounded-full'>
                    <img src={user.avatar || UserPfp} alt='User profile picture' className='h-12 w-12 rounded-full border-2 border-transparent group-hover:border-blue-700 sm:h-[60px] sm:w-[60px]' />

                    <p className="truncate text-[var(--text-color)]"> {user.username} </p>
                  </div>
                  
                  <button 
                    className={`flex shrink-0 items-center justify-center gap-1 rounded-[8px] px-3 py-2 text-sm font-semibold sm:hidden sm:group-hover:flex ${user.hasSentRequest ? "cursor-not-allowed bg-gray-400 text-white" : "bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"} `}
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
