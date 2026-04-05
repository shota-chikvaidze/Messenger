const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    username: { type: String, required: true } ,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isOnline: { type: Boolean },
    avatar: { type: String },

    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    lastSeen: { type: Date },

    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("User", userSchema)