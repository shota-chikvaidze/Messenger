const mongoose = require("mongoose")

const messageSchema = mongoose.Schema({

    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    content: { type: String },

    type: {
        type: String,
        enum: ['text', 'image', 'file'],
        default: 'text'
    },

    readBy: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],

    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now }

}, { timestamps: true })

messageSchema.index({ conversationId: 1, createdAt: -1 })

module.exports = mongoose.model("Message", messageSchema)