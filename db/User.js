const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: String,
    position: String,
    mobile: {
        type: String,
        unique: true,
        uniqueCaseInsensitive: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        uniqueCaseInsensitive: true,
        required: true
    },
    password: String,
    employee: Boolean,
    admin: Boolean,
    blocked: Boolean
})

module.exports = mongoose.model("users", userSchema);