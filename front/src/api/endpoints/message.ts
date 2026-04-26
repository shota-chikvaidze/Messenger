import axios from "../axios"

// types for get messages
interface MessageSender {
    id: string
    username: string
    avatar: string
}

export interface MessageType {
    id: string,
    conversationId: string,
    sender: MessageSender,
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

// interface for editing messages
export interface EditMessagePayload {
    content: string
}


export const GetMessagesEndpoint = async (id: string): Promise<GetMessagesData> => {
    const res = await axios.get(`/message/get-messages/${id}`)
    return res.data
}

export const SendMessagesEndpoint = async (payload: SendMessagePayload, id: string) => {
    const res = await axios.post(`/message/send-message/${id}`, payload)
    return res.data
}

export const RemoveMessagesEndpoint = async (id: string) => {
    const res = await axios.delete(`/message/delete-message/${id}`)
    return res.data
}

export const EditMessagesEndpoint = async (payload: EditMessagePayload, id: string) => {
    const res = await axios.patch(`/message/edit-message/${id}`, payload)
    return res.data
}