const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    userId: String,
    comment: String
})

const likeSchema = new mongoose.Schema({
    userId: String
})

const noteSchema = new mongoose.Schema({
    title: String,
    description: String,
    image: String,
    file: String,
    date: String, 
    month: String,
    year: String,
    likes: [likeSchema],
    comments: [commentSchema],
    views: Number
})

module.exports = mongoose.model("notes", noteSchema);