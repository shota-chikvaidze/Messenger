import axios from "../axios";

// get conversation type
interface UserPreview {
    id: string
    username: string
    avatar?: string
    isOnline?: boolean
}
interface ConversationType {
    id: string
    participants: UserPreview[],

    isGroup: boolean,
    groupName?: string,
    groupAvatar?: string |null,
    
    lastMessage?: {
        content: string
        sender: string
    } | null

    groupAdmin?: string | null

    createdAt: string
    updatedAt: string
}
interface ConversationData {
    conversations: ConversationType[]
    message: string
}

// get conversation id type
interface ConversationIdData {
    conversation: ConversationType
    message: string
}

// create group conversation types
export interface CreateGroupConversationPayload {
  name: string
  participantIds: string[]
}
// create conversation types
export interface CreateConversationPayload {
    participants: string[], 
    groupName: string
    id?: string
}
interface CreateConversationData {
    conversation: ConversationType
    message: string
}


export const CreateConvEndpoint = async (payload: CreateConversationPayload): Promise<CreateConversationData> => {
    const res = await axios.post('/conversation/create-conversations', payload)
    return res.data
}

export const CreateGroupConvEndpoint = async (payload: CreateGroupConversationPayload): Promise<CreateConversationData> => {
    const res = await axios.post('/conversation/create-group-conversations', payload)
    return res.data
}

export const GetConversationEndpoint = async (): Promise<ConversationData> => {
    const res = await axios.get('/conversation/get-conversations')
    return res.data
}

export const GetConversationIdEndpoint = async (id: string): Promise<ConversationIdData> => {
    const res = await axios.get(`/conversation/get-conversations-id/${id}`)
    return res.data
}

