const mongoose = require("mongoose")

const conversationSchema = mongoose.Schema({

    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", requried: true }],
    isGroup: { type: Boolean, default: false },
    groupName: { type: String, trim: true },

    groupAvatar: { type: String },
    
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

}, { timestamps: true })

conversationSchema.index({ participants: 1, updatedAt: -1 });

module.exports = mongoose.model("Conersation", conversationSchema)