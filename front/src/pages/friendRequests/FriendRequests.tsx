
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GetFriendReqEndpoint, AcceptFriendReqEndpoint, RejectFriendReqEndpoint } from '../../api/endpoints/friends'
import { showSuccessToast, showErrorToast } from '../../utils/toast'
import UserPfp from '../../assets/images/user-pfp.jpg'
import { IoCheckmark, IoClose } from 'react-icons/io5'
import { BsPersonRaisedHand } from 'react-icons/bs'

export const FriendRequests = () => {

  const qc = useQueryClient()

  const { data: friendReqData, isLoading } = useQuery({
    queryKey: ['get-friend-requests'],
    queryFn: () => GetFriendReqEndpoint()
  })

  const friends = friendReqData?.filteredRequests || []

  const acceptReqMutation = useMutation({
    mutationKey: ['accept-frind-request'],
    mutationFn: (id: string) => AcceptFriendReqEndpoint(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['get-friend-requests'] })
      qc.invalidateQueries({ queryKey: ['get-friends'] })
      showSuccessToast(data.message || "Accepted successfully!")
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error occurred')
    }
  })

  const handleAcceptMutation = (id: string) => {
    acceptReqMutation.mutate(id)
  }

  const rejectReqMutation = useMutation({
    mutationKey: ['reject-frind-request'],
    mutationFn: (id: string) => RejectFriendReqEndpoint(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['get-friend-requests'] })
      qc.invalidateQueries({ queryKey: ['get-friends'] })
      showSuccessToast(data.message || "Rejected successfully!")
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error occurred')
    }
  })

  const handleRejectMutation = (id: string) => {
    rejectReqMutation.mutate(id)
  }


  return (
    <section className='h-full w-full overflow-y-auto bg-[var(--outlet-color)] p-4 text-[#f2f3f5] sm:p-6 lg:p-10'>
      <div className='mx-auto w-full max-w-5xl'>
        
        <div className='border-b border-[#2a2b32] pb-5'>
          <h1 className='text-xl font-semibold text-white'>Friend requests</h1>

          <p className='mt-1 text-sm text-[#949ba4]'>
            {friends.length === 1 ? '1 pending request' : `${friends.length} pending requests`}
          </p>
        </div>

        <div className='mt-4'>
          {isLoading ? (
            <div className='flex h-64 items-center justify-center'>
              <p className='text-sm font-medium text-[#b5bac1]'>Loading requests...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className='flex h-72 flex-col items-center justify-center text-center'>
              <div className='mb-4 grid h-14 w-14 place-items-center rounded-[8px] bg-[#202128]'>
                <BsPersonRaisedHand className='text-[26px] text-[#a6a8b0]' />
              </div>

              <h2 className='text-base font-semibold text-white'>No pending requests</h2>
              <p className='mt-1 max-w-[280px] text-sm leading-5 text-[#949ba4]'>
                New friend requests will appear here.
              </p>
            </div>
          ) : (
            <div className='divide-y divide-[#26272f]'>
              {friends.map((friendReq) => (
                <div
                  key={friendReq.id}
                  className='flex min-h-[72px] items-center justify-between gap-3 rounded-[8px] px-2 py-3 transition hover:bg-[#22232a] sm:gap-4 sm:px-3'
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    
                    <div className='relative shrink-0'>
                      <img
                        src={friendReq.from.avatar || UserPfp}
                        alt={`${friendReq.from.username} profile picture`}
                        className='h-11 w-11 rounded-full object-cover'
                      />

                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-[#17181d] ${
                          friendReq.from.isOnline ? 'bg-[#23a55a]' : 'bg-[#17181d] ring-2 ring-[#8c8f99]'
                        }`}
                      />
                    </div>

                    <div className='min-w-0'>
                      <h3 className='truncate text-[15px] font-semibold text-white'>{friendReq.from.username}</h3>
                      <p className='mt-0.5 text-[13px] text-[#949ba4]'>Incoming friend request</p>
                    </div>
                  </div>

                  <div className='flex shrink-0 items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => handleAcceptMutation(friendReq.from.id)}
                      disabled={acceptReqMutation.isPending || rejectReqMutation.isPending}
                      aria-label={`Accept ${friendReq.from.username}`}
                      className='grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-[#2b2d31] text-[#23a55a] transition hover:bg-[#34363c] hover:text-[#37c06f] disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      <IoCheckmark className='text-[22px]' />
                    </button>

                    <button
                      type='button'
                      onClick={() => handleRejectMutation(friendReq.from.id)}
                      disabled={acceptReqMutation.isPending || rejectReqMutation.isPending}
                      aria-label={`Reject ${friendReq.from.username}`}
                      className='grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-[#2b2d31] text-[#f23f42] transition hover:bg-[#34363c] hover:text-[#ff6265] disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      <IoClose className='text-[23px]' />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
