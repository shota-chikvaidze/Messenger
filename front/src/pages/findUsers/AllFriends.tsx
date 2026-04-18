import { useState } from 'react'

import { GetFriendsEndpoint } from '../../api/endpoints/friends'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import FriendsIcon from '../../assets/icons/meeting.png'
import UserPfp from '../../assets/images/user-pfp.jpg'
import { IoSearch } from "react-icons/io5";
import { BsChatFill, BsPersonRaisedHand, BsThreeDotsVertical } from "react-icons/bs";

export const AllFriends = () => {

  const [search, setSearch] = useState('')

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['get-friends', search],
    queryFn: () => GetFriendsEndpoint(search)
  })

  const friends = friendsData || []

  return (
    <section className="h-screen w-full overflow-hidden text-[var(--text-color)]">
      <div className="flex h-full flex-col">
        <header className="flex min-h-[62px] items-center gap-4 border-b border-[#25262d] px-7">
          
          <div className="flex items-center gap-2 pr-4 text-[17px] font-semibold text-white">
            <BsPersonRaisedHand className="text-[20px] text-[#9da0a8]" />
            <span>Friends</span>
          </div>

          <Link
            to="/profile/find-friends"
            className="flex items-center h-9 rounded-[8px] bg-[#6671ff] px-4 text-[16px] font-semibold text-white transition hover:bg-[#5865f2]"
          >
            Add Friend
          </Link>

        </header>

        <div className="flex flex-1 flex-col px-7 py-3">
          <label className="relative mb-7 block">
            <IoSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[22px] text-[#d8d9de]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="h-[50px] w-full rounded-[8px] border border-[#30313a] bg-[#121318] pl-12 pr-4 text-[18px] text-white outline-none transition placeholder:text-[#a6a8b0] focus:border-[#5865f2]"
            />
          </label>

          <div className="mb-5 text-[16px] font-semibold text-white">
            All friends - {friends.length}
          </div>

          <div className="flex-1 overflow-y-auto pr-3 [scrollbar-color:#6e707a_transparent] [scrollbar-width:thin]">
            {friendsLoading ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-lg font-medium text-[#bfc1c8]">Loading...</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              
                <h1 className="text-lg font-semibold text-white">No friends found</h1>

                <p className="mt-1 max-w-[260px] text-sm text-[#a6a8b0]">
                  Find and connect with people to start chatting.
                </p>
                
              </div>
            ) : (
              <div className="divide-y divide-[#26272e]">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="group flex min-h-[78px] w-full items-center justify-between gap-4 px-5 transition hover:bg-[#1d1e24]"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      
                      <div className="relative shrink-0">
                        <img
                          src={friend?.avatar || UserPfp}
                          alt={`${friend.username} profile picture`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[3px] border-[#17181d] ${
                            friend.isOnline ? 'bg-[#23a55a]' : 'bg-[#17181d] ring-2 ring-[#8c8f99]'
                          }`}
                        />
                      </div>

                      <div>
                        <p className="truncate text-[18px] font-seibold leading-6 text-white">
                          {friend.username}
                        </p>
                        <p className="text-[14px] font-medium leading-5 text-[#9da0a8]">
                          {friend.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 pr-4 text-[#b9bbc2]">
                      <button
                        type="button"
                        aria-label={`Message ${friend.username}`}
                        className="grid h-10 w-10 cursor-pointer place-items-center rounded-[8px] transition hover:bg-[#2c2d35] hover:text-white"
                      >
                        <BsChatFill className="text-[18px]" />
                      </button>

                      <button
                        type="button"
                        aria-label={`More options for ${friend.username}`}
                        className="grid h-10 w-10 cursor-pointer place-items-center rounded-[8px] transition hover:bg-[#2c2d35] hover:text-white"
                      >
                        <BsThreeDotsVertical className="text-[19px]" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            )}
          </div>
        </div>

      </div>
    </section>
  )
}
