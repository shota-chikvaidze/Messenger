import { GetFriendsEndpoint } from '../api/endpoints/friends'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import FriendsIcon from '../assets/icons/meeting.png'
import UserPfp from '../assets/images/user-pfp.jpg'
import { BiMessageRounded } from "react-icons/bi";

export const Sidebar = () => {

  const { data: friendsData } = useQuery({
    queryKey: ['get-friends'],
    queryFn: () => GetFriendsEndpoint()
  })


  return (
    <aside className='w-[350px] mr-4 h-screen border-r border-gray-200 '>
        <div className='flex flex-col gap-4 mx-3 h-full '>

          <div className='w-full my-4 space-y-3 '>

            <div className='flex justify-between items-center '>
              <img 
                src={UserPfp} 
                alt='User profile picture' 
                className='w-10 h-10 rounded-full '
              />

              <Link to={'/profile/friend-requests'}>
                <BiMessageRounded className='w-10 h-10 p-2 rounded-xl cursor-pointer bg-sky-500 text-white ' />
              </Link>
            </div>

            <div>
              <input 
                type='search' 
                className='w-full border border-gray-200 rounded-2xl py-2 px-4 outline:border-gray-300 '
                placeholder='Search users'
              />
            </div>
          </div>

          <div className='h-full '>

            {friendsData?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">

                <div className="rounded-2xl mb-4 shadow-sm">
                  <img 
                    src={FriendsIcon} 
                    alt="No friends" 
                    className="w-10 h-10 opacity-70" 
                  />
                </div>

                <h1 className="text-gray-800 text-lg font-semibold">
                  No friends yet
                </h1>

                <p className="text-gray-500 text-sm mt-1 max-w-[220px]">
                  Find and connect with people to start chatting.
                </p>

              </div>
            ) : (
              <div>
                {friendsData?.map((friend) => (
                  <div key={friend._id}>
                    <p> {friend.username} </p>
                  </div>
                ))}
              </div>
            
            )}
            
          </div>
            
        </div>
    </aside>
  )
}
