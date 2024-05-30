const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        required: true
    }
    
});

const walletSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    currentBalance: {
        type: Number,
        default: 0
    },
    transactions: [transactionSchema]
});




module.exports = mongoose.model('Wallet', walletSchema);


