const mongoose = require("mongoose")
const crypto = require("crypto")

const refreshTokenSchema = mongoose.Schema({

    token: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    expiresAt: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }

})

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

refreshTokenSchema.statics.createToken = async function(userId) {
    
    const token = crypto.randomBytes(40).toString('hex')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const refreshToken = await this.create({
        userId,
        token,
        expiresAt
    })

    return refreshToken
}

refreshTokenSchema.statics.verifyToken = async function(token) {
    const refreshToken = await this.findOne({
        token,
        expiresAt: { $gt: new Date() }
    })

    if(!refreshToken){
        return null
    }

    return refreshToken.token
}

refreshTokenSchema.statics.logout = async function(token) {
    await this.deleteOne({token})
}
