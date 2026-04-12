
import { useQuery, useMutation } from '@tanstack/react-query'
import { GetFriendReqEndpoint, AcceptFriendReqEndpoint } from '../../api/endpoints/friends'
import { showSuccessToast, showErrorToast } from '../../utils/toast'

export const FriendRequests = () => {

  const { data: friendReqData } = useQuery({
    queryKey: ['get-friend-requests'],
    queryFn: () => GetFriendReqEndpoint()
  })

  const friends = friendReqData?.filteredRequests || []
  console.log(friends)

  const acceptReqMutation = useMutation({
    mutationKey: ['accept-frind-request'],
    mutationFn: (id: string) => AcceptFriendReqEndpoint(id),
    onSuccess: (data) => {
      showSuccessToast(data.message || "Accepted successfully!")
    },
    onError: (error: any) => {
      showErrorToast(error?.response?.data?.message || 'Error occurred')
    }
  })

  const handleAcceptMutation = (id: string) => {
    acceptReqMutation.mutate(id)
  }

  return (
    <section className='w-full min-h-screen flex justify-center '>
      <div className='max-w-5xl w-full  '>
        
        {friends?.map((friendReq) => (
          <div key={friendReq._id}>
            <p> {friendReq.from.username} </p>

            <button 
              onClick={() => handleAcceptMutation(friendReq.from._id)}
              className='cursor-pointer '
            > 
              Accept 
            </button>

          </div>
        ))}

      </div>
    </section>
  )
}
