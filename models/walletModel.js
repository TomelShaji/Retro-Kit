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


// walletSchema.pre('save', function(next) {
  
//     const totalTransactionAmount = this.transactions.reduce((total, transaction) => {
//         return total + transaction.amount;
//     }, 0);

   
//     this.currentBalance += totalTransactionAmount;

//     next();
// });

module.exports = mongoose.model('Wallet', walletSchema);


