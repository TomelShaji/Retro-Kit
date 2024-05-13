const User = require('../models/userModel')
const category = require('../models/categoryModel');
const bcrypt = require('bcrypt')
const Product = require('../models/productModel');
const adminAuth = require('../middleware/adminAuth');
const Order = require('../models/orderModel')
const Wallet= require('../models/walletModel')

const loadOrders = async(req,res)=>{
    try {
        const page = req.query.page || 1; // Get the page number from query params or default to 1
        const perPage = 9; // Number of orders per page
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage);
        const totalCount = await Order.countDocuments();
        //const orders = await Order.find().sort({ createdAt: -1 });
        res.render('adminOrders', { orders, currentPage: parseInt(page), totalPages: Math.ceil(totalCount / perPage) });
       // res.render('adminOrders',{orders})
    } catch (error) {
        console.log(error.message);
    }
}

const loadOrderDetail = async(req,res)=>{
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId).populate('products.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }
        res.render('orderDetail',{order})
    } catch (error) {
        console.log(error.message);
    }
}



const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const newStatus = req.body.status;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if the order status is being changed to 'Cancelled'
        if (newStatus === 'Cancelled') {
            // Calculate refund amount
            const refundAmount = order.totalPrice;

            // Update the order status and mark it as cancelled
            order.status = newStatus;
            order.is_cancelled = true;
            await order.save();

            // Find the user's wallet and update the balance
            const wallet = await Wallet.findOne({ userId: order.userId });
            if (wallet) {
                // Add refunded amount to user's wallet
                wallet.transactions.push({ amount: refundAmount });
                wallet.currentBalance += refundAmount;
                await wallet.save();
            } else {
                // If the user doesn't have a wallet yet, create one
                await Wallet.create({ userId: order.userId, currentBalance: refundAmount, transactions: [{ amount: refundAmount }] });
            }
        } else {
            // Update the order status without refund logic for other status changes
            order.status = newStatus;
            await order.save();
        }

        res.status(200).json(order);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};




module.exports={
    loadOrders,
    loadOrderDetail,
    updateOrderStatus
}