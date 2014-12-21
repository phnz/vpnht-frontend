mongoose = require("mongoose")
password = require("mongoose")
nthash = require('smbhash').nthash
bcrypt = require("bcrypt-nodejs")
crypto = require("crypto")
stripeCustomer = require("./plugins/stripe-customer")
secrets = require("../config/secrets")
timestamps = require("mongoose-timestamp")
userSchema = new mongoose.Schema(
    email:
        type: String
        unique: true
        lowercase: true

    password: String
    coupon: String
    billingType: String
    username:
        type: String
        unique: true
        lowercase: true

    profile:
        name:
            type: String
            default: ""

        gender:
            type: String
            default: ""

        location:
            type: String
            default: ""

        website:
            type: String
            default: ""

        picture:
            type: String
            default: ""

    resetPasswordToken: String
    resetPasswordExpires: Date
)
stripeOptions = secrets.stripeOptions
userSchema.plugin timestamps
userSchema.plugin stripeCustomer, stripeOptions

# hash the password
userSchema.pre "save", (next) ->
    user = this
    return next() unless user.isModified("password")
    user.password = nthash(user.password)
    next()

# validate password
userSchema.methods.comparePassword = (candidatePassword, cb) ->
    return cb(true, null) if @password isnt nthash(candidatePassword)
    cb null, true

# gravatar
userSchema.methods.gravatar = (size) ->
    size = 200 unless size
    return "https://gravatar.com/avatar/?s=" + size + "&d=retro" unless @email
    md5 = crypto.createHash("md5").update(@email).digest("hex")
    return "https://gravatar.com/avatar/" + md5 + "?s=" + size + "&d=retro"

module.exports = mongoose.model("User", userSchema)
