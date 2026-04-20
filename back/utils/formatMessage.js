const formatId = (value) => {
    if (!value) return value
    return String(value._id || value.id || value)
}

const formatSender = (sender) => {
    if (!sender) return null

    if (sender._id || sender.id) {
        return {
            id: formatId(sender),
            username: sender.username,
            avatar: sender.avatar
        }
    }

    return {
        id: formatId(sender)
    }
}

const formatMessage = (message) => ({
    id: formatId(message),
    conversationId: formatId(message.conversationId),
    sender: formatSender(message.sender),
    content: message.content,
    type: message.type,
    readBy: message.readBy?.map(formatId) || [],
    isEdited: message.isEdited,
    isDeleted: message.isDeleted,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
})

module.exports = { formatMessage }
