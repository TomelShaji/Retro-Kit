const User = require('../models/userModel');
const product = require('../models/productModel');
const category = require('../models/categoryModel');
const cart = require('../models/cartModel');
const Address = require('../models/addressModel');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const randomstring = require('randomstring');
const Order = require('../models/orderModel')
const Wallet = require('../models/walletModel');





const loadWallet = async (req, res) => {
    try {
        const userId = req.userId;
        const pageLimit = 5; // Number of transactions per page
        const page = parseInt(req.query.page) || 1; // Current page, default to 1

        // Find the wallet document for the user and populate the transactions field
        const wallet = await Wallet.findOne({ userId }).populate({
            path: 'transactions',
            options: { 
                limit: pageLimit,
                skip: (page - 1) * pageLimit,
                sort: { createdAt: -1 } // Sort transactions in descending order by createdAt
            }
        });

        if (!wallet) {
            return res.status(404).json({ success: false, message: 'Wallet not found' });
        }

        // Calculate total balance
        let totalBalance = 0;
        wallet.transactions.forEach(transaction => {
            totalBalance += transaction.amount;
        });

        // Calculate total number of pages
        const totalTransactions = await wallet.transactions.length;
        const totalPages = Math.ceil(totalTransactions / pageLimit);

        res.render('wallet', { 
            transactionHistory: wallet.transactions, 
            totalBalance, 
            currentPage: page, 
            totalPages, 
            wallet 
        });

    } catch (error) {
        console.log(error.message)
    }
}




module.exports = {
    loadWallet
};