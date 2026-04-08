const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    username: { type: String, required: true } ,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isOnline: { type: Boolean },
    avatar: { type: String },

    friends: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    friendRequests: [{
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { 
            type: String, 
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
        },
        createdAt: { type: Date, default: Date.now }
    }],

    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    lastSeen: { type: Date },

    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("User", userSchema)