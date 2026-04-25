import { useEffect, useState } from 'react'

import { GetFriendsEndpoint, RemoveFriendEndpoint } from '../../api/endpoints/friends'
import { CreateConvEndpoint, type CreateConversationPayload, GetConversationEndpoint } from '../../api/endpoints/conversation'
import { useAuth } from '../../store/useAuth'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { showSuccessToast, showErrorToast} from '../../utils/toast'

import UserPfp from '../../assets/images/user-pfp.jpg'
import { IoSearch } from "react-icons/io5";
import { BsChatFill, BsPersonRaisedHand, BsThreeDotsVertical } from "react-icons/bs";


export const AllFriends = () => {

  const [search, setSearch] = useState('')
  const [morePopupFriendId, setMorePopupFriendId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const user = useAuth((store) => store.user)
  const navigate = useNavigate()

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['get-friends', search],
    queryFn: () => GetFriendsEndpoint(search)
  })

  const { data: conversationData, isLoading: conversationLoading } = useQuery({
    queryKey: ['get-conversations',],
    queryFn: () => GetConversationEndpoint()
  })

  const friends = friendsData || []
  const currentUser = user?.id
  const conversations = conversationData?.conversations || []

  const removeFriendMutation = useMutation({
    mutationKey: ['remove-friend-mutation'],
    mutationFn: (id: string) => RemoveFriendEndpoint(id),
    onSuccess: (data) => {
      showSuccessToast(data.message || 'Removed friend successfully!')
      setMorePopupFriendId(null)
      queryClient.invalidateQueries({ queryKey: ['get-friends'] })
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error Occurred')
    }
  })

  const handleRemoveFriend = (id: string) => {
    removeFriendMutation.mutate(id)
  }

  const toggleMorePopup = (id: string) => {
    setMorePopupFriendId((currentId) => currentId === id ? null : id)
  }

  // function for closing popup
  useEffect(() => {
    if (!morePopupFriendId) return

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (target.closest(`[data-more-popup-root="${morePopupFriendId}"]`)) return

      setMorePopupFriendId(null)
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [morePopupFriendId])


  const createConvMutation = useMutation({
    mutationKey: ['create-conversation-mutation'],
    mutationFn: (payload: CreateConversationPayload) => CreateConvEndpoint(payload),
    onSuccess: (data) => {
      showSuccessToast(data.message || 'Conversation ready')
      navigate(`/profile/chat/${data.conversation.id}`)
      queryClient.invalidateQueries({ queryKey: ['get-conversations'] })
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error Occurred')
    }
  })

  const handleStartConversation = (otherUser: string, username: string) => {
    if (!currentUser) {
      showErrorToast('Please sign in again to start a conversation')
      return
    }
    
    createConvMutation.mutate({
      participants: [currentUser, otherUser],
      groupName: username || '',
    })
  }

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

        <div className="flex min-h-0 flex-1 flex-col px-7 py-3">
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

          <div className="min-h-0 flex-1">
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
              <div className="h-full overflow-y-auto pr-3 divide-y divide-[#26272e]">
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

                        <span className={`w-3 h-3 rounded-full absolute -bottom-0.5 right-0 border-2  ${friend?.isOnline ? "bg-[#23a55a] border-[#17181d]" : "bg-[#17181d] border-[#858585]"} `} />

                      </div>

                      <div>
                        <p className="truncate text-[18px] font-semibold leading-6 text-white">
                          {friend.username}
                        </p>
                        <p className="text-[14px] font-medium leading-5 text-[#9da0a8]">
                          {friend.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>

                    <div
                      data-more-popup-root={friend.id}
                      className="flex shrink-0 relative items-center gap-2 pr-4 text-[#b9bbc2]"
                    >
                      <button
                        type="button"
                        aria-label={`Message ${friend.username}`}
                        onClick={() => handleStartConversation(friend.id, friend.username)}
                        className="grid h-10 w-10 cursor-pointer place-items-center rounded-[8px] transition hover:bg-[#2c2d35] hover:text-white"
                      >
                        <BsChatFill className="text-[18px]" />
                      </button>

                      <button
                        onClick={() => toggleMorePopup(friend.id)}
                        type="button"
                        aria-expanded={morePopupFriendId === friend.id}
                        aria-label={`More options for ${friend.username}`}
                        className="grid h-10 w-10 cursor-pointer place-items-center rounded-[8px] transition hover:bg-[#2c2d35] hover:text-white"
                      >
                        <BsThreeDotsVertical className="text-[19px]" />
                      </button>

                      {morePopupFriendId === friend.id && (
                        <div className="absolute right-4 bottom-12 z-20 w-44 rounded-[8px] border border-[#30313a] bg-[var(--background-secondary-color)] p-1 shadow-xl shadow-black/30">
                          <button
                            type="button"
                            onClick={() => handleRemoveFriend(friend.id)}
                            disabled={removeFriendMutation.isPending}
                            className="flex w-full cursor-pointer items-center rounded-[6px] px-3 py-2 text-left text-[15px] font-semibold text-[#ff6b6b] transition hover:bg-[#2c2d35] hover:text-[#ff8585] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Remove friend
                          </button>
                        </div>
                      )}
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
