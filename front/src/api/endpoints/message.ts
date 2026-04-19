import axios from "../axios"

// types for get messages
interface MessageSender {
    id: string
    username: string
    avatar?: string
}

export interface MessageType {
    id: string,
    conversationId: string,
    sender: MessageSender | string | null,
    content: string,
    type: string,
    readBy: string[],
    isEdited: boolean,
    isDeleted: boolean,
    createdAt: string,
    updatedAt: string,
}

interface GetMessagesData {
    messages: MessageType[],
    message: string,
}

// types for send messages
export interface SendMessagePayload {
    content: string
    type: string
}


export const GetMessagesEndpoint = async (id: string): Promise<GetMessagesData> => {
    const res = await axios.get(`/message/get-messages/${id}`)
    return res.data
}

export const SendMessagesEndpoint = async (payload: SendMessagePayload, id: string) => {
    const res = await axios.post(`/message/send-message/${id}`, payload)
    return res.data
}
