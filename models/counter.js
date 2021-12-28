const mongoose = require('mongoose')

const counterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    seq_value: {
        type: Number,
        required: true
    }
})


module.exports = mongoose.model('Counter', counterSchema)
