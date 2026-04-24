import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { socket } from '../socket/socket'

interface PresenceEvent {
  userId: string
  lastSeen?: string
}

export const usePresenceUpdates = () => {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    const setUserOnlineStatus = ({ userId, lastSeen }: PresenceEvent, isOnline: boolean) => {
      queryClient.setQueriesData({ queryKey: ['get-conversations'] }, (oldData: any) => {
        if (!oldData?.conversations) return oldData

        return {
          ...oldData,
          conversations: oldData.conversations.map((conversation: any) => ({
            ...conversation,
            participants: conversation.participants.map((participant: any) => (
              participant.id === userId
                ? { ...participant, isOnline, lastSeen: lastSeen || participant.lastSeen }
                : participant
            ))
          }))
        }
      })

      queryClient.setQueriesData({ queryKey: ['get-conversation'] }, (oldData: any) => {
        if (!oldData?.conversation) return oldData

        return {
          ...oldData,
          conversation: {
            ...oldData.conversation,
            participants: oldData.conversation.participants.map((participant: any) => (
              participant.id === userId
                ? { ...participant, isOnline, lastSeen: lastSeen || participant.lastSeen }
                : participant
            ))
          }
        }
      })

      queryClient.setQueriesData({ queryKey: ['get-friends'] }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData

        return oldData.map((friend: any) => (
          friend.id === userId
            ? { ...friend, isOnline, lastSeen: lastSeen || friend.lastSeen }
            : friend
        ))
      })
    }

    const handleUserOnline = (data: PresenceEvent) => {
      setUserOnlineStatus(data, true)
    }

    const handleUserOffline = (data: PresenceEvent) => {
      setUserOnlineStatus(data, false)
    }

    socket.on('user_online', handleUserOnline)
    socket.on('user_offline', handleUserOffline)

    return () => {
      socket.off('user_online', handleUserOnline)
      socket.off('user_offline', handleUserOffline)
    }
  }, [queryClient])
}
