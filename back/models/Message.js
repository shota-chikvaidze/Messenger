const express = require('express')
const mongoose = require('mongoose')

const messageSchema = mongoose.Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    content: { type: String },
    attachments: { type: [Object] },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

module.exports = mongoose.model('Message', messageSchema)