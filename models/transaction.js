const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    userId: {
        type: Number,
        required: true
    },
    symbol: {
        type: String,
        required: true,
        trim: true
    },
    action: {
        type: String,
        required: true,
        enum: ['B','S']
    },
    qty: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    dt: {
      type: Date,
      required: true
      //  // dfault: Dte.now
    }
})




module.exports = mongoose.model('Transaction', transactionSchema)
