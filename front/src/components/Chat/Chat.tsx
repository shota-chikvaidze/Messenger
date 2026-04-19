import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { GetConversationIdEndpoint } from '../../api/endpoints/conversation'
import { GetMessagesEndpoint, SendMessagesEndpoint, type SendMessagePayload } from '../../api/endpoints/message'
import { useAuth } from '../../store/useAuth'

import { useQueryClient } from '@tanstack/react-query'
import { socket } from '../../socket/socket'
import type { MessageType } from '../../api/endpoints/message'


const Chat = () => {
    
  const [sendMessagePayload, setSendMessagePayload] = useState({
    content: '',
    type: 'text'
  })
  const { id } = useParams()
  const user = useAuth((store) => store.user)
  const queryClient = useQueryClient()

  const { data: conversationData, isLoading: conversationLoading } = useQuery({
    queryKey: ['get-conversation', id],
    queryFn: () => GetConversationIdEndpoint(id as string),
    enabled: Boolean(id)
  })

  const { data: messageData, isLoading: messageLoading } = useQuery({
    queryKey: ['get-messages', id],
    queryFn: () => GetMessagesEndpoint(id as string),
    enabled: Boolean(id)
  })

  const conversation = conversationData?.conversation
  const messages = messageData?.messages || []
  const isLoading = conversationLoading || messageLoading

  const currentUser = user?.id
  const otherUser = conversation?.participants.find((user) => user.id !== currentUser)

  const sendMessageMutation = useMutation({
    mutationKey: ['send-message'],
    mutationFn: ({ payload, id }: { payload: SendMessagePayload; id: string }) => SendMessagesEndpoint(payload, id),
    onSuccess: () => {
      setSendMessagePayload({
        content: '',
        type: 'text'
      })
    }  
  })

  const handleSendMessage = (content: string, type: string) => {
    if (!id || !content.trim()) return

    sendMessageMutation.mutate({
      id,
      payload: {
        content: content.trim(),
        type
      }
    })
  }

  useEffect(() => {
    if (!id) return
    
    if (!socket.connected) {
      socket.connect()
    }
  
    const handleConnect = () => {
      socket.emit('join_conversation', { conversationId: id })
    }

    const handleConnectError = (error: Error) => {
      console.error('Socket connection error:', error.message)
    }

    socket.emit('join_conversation', { conversationId: id })
  
    const handleNewMessage = (newMessage: MessageType) => {
      queryClient.setQueryData(['get-messages', id], (oldData: any) => {
        if (!oldData) return oldData
      
        return {
          ...oldData,
          messages: oldData.messages.some((message: MessageType) => message.id === newMessage.id)
            ? oldData.messages
            : [...oldData.messages, newMessage]
        }
      })
    }
  
    socket.on('connect', handleConnect)
    socket.on('connect_error', handleConnectError)
    socket.on('new_message', handleNewMessage)
  
    return () => {
      socket.off('connect', handleConnect)
      socket.off('connect_error', handleConnectError)
      socket.off('new_message', handleNewMessage)
    }
  }, [id, queryClient])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!conversation) {
    return <div>Select a conversation</div>
  }


  return (
    <div>
      <h1>{conversation.groupName}</h1>

      <div>
        {messages.map((message) => (
          <div key={message.id}>
          
            <p> {message.content} </p>

          </div>
        ))}
      </div>




      <div>
        <input 
          type='text'
          onKeyDown={(e) => {
            if(e.key === 'Enter') {
              handleSendMessage(sendMessagePayload.content, 'text')
            }
          }}
          value={sendMessagePayload.content}
          onChange={(e) => setSendMessagePayload((payload) => ({
            ...payload,
            content: e.target.value,
            type: 'text'
          }))}
          className='placeholder:text-white text-white '
          placeholder={`Message @${otherUser?.username}`}
        />
        
      </div>

    </div>
  )
}

export default Chat
