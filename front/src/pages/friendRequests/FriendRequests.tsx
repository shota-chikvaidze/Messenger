
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GetFriendReqEndpoint, AcceptFriendReqEndpoint, RejectFriendReqEndpoint } from '../../api/endpoints/friends'
import { showSuccessToast, showErrorToast } from '../../utils/toast'

export const FriendRequests = () => {

  const qc = useQueryClient()

  const { data: friendReqData } = useQuery({
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
    <section className='w-full min-h-screen flex justify-center '>
      <div className='max-w-5xl w-full  '>
        
        {friends?.map((friendReq) => (
          <div key={friendReq.id}>
            <p> {friendReq.from.username} </p>

            <div className='space-x-10 '>
              <button 
                onClick={() => handleAcceptMutation(friendReq.from.id)}
                className='cursor-pointer '
              > 
                Accept 
              </button>

              <button 
                onClick={() => handleRejectMutation(friendReq.from.id)}
                className='cursor-pointer '
              > 
                Reject 
              </button>
            </div>


          </div>
        ))}

      </div>
    </section>
  )
}
