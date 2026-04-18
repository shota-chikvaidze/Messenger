import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { GetConversationIdEndpoint } from '../../api/endpoints/conversation'

const Chat = () => {
    
  const { id } = useParams()

  const { data: conversationData, isLoading } = useQuery({
    queryKey: ['get-conversation', id],
    queryFn: () => GetConversationIdEndpoint(id as string),
    enabled: Boolean(id)
  })

  const conversation = conversationData?.conversation

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!conversation) {
    return <div>Select a conversation</div>
  }

  return (
    <div>
      <h1>{conversation.groupName}</h1>

    </div>
  )
}

export default Chat
