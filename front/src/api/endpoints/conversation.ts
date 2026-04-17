import axios from "../axios";

// create conversation types
export interface CreateConversationPayload {
    participants: string[], 
    groupName: string
}
export interface createConversationData {
    data: CreateConversationPayload , 
    message: string
}

// get conversation type
interface UserPreview {
    _id: string
    username: string
    avatar?: string
    isOnline?: boolean
}

interface ConversationType {
    _id: string
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

export const CreateConvEndpoint = async (payload: CreateConversationPayload): Promise<createConversationData> => {
    const res = await axios.post('/conversation/create-conversations', payload)
    return res.data
}

export const GetConversationEndpoint = async (): Promise<ConversationData> => {
    const res = await axios.get('/conversation/get-conversations')
    return res.data
}