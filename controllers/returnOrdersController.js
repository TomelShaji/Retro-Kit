const User = require('../models/userModel');
const Product = require('../models/productModel');
const cart = require('../models/cartModel');
const Address = require('../models/addressModel'); 
const Order = require('../models/orderModel');
const Wishlist = require('../models/wishlistModel');
const Coupon = require('../models/couponModel');
const Offer = require('../models/categoryOfferModel');
const Category = require('../models/categoryModel');
const Wallet = require('../models/walletModel')

const loadReturnOrders = async (req, res) => {
    try {
        const returnOrders = await Order.find({ status: 'Return Requested' }).populate('products.productId');
        res.render('returnOrders', { returnOrders });
    } catch (error) {
        console.log(error.message);
    }
};

// const updateReturnRequest = async (req, res) => {
//     try {
//         const orderId = req.params.id;
//         const action = req.body.action;

//         const order = await Order.findById(orderId);
//         if (!order) {
//             return res.status(404).json({ success: false, message: 'Order not found' });
//         }

//         if (action === 'accept') {
//             order.status = 'Returned';
//             order.is_return = true;

//             // Update the stock for each product in the order
//             for (const item of order.products) {
//                 const product = await Product.findById(item.productId);
//                 if (product) {
//                     product.stock += item.quantity;
//                     await product.save();
//                 }
//             }

//             if (order.paymentMethod !== 'Cash on Delivery') {
//                 const refundAmount = order.totalPrice;
//                 const wallet = await Wallet.findOne({ userId: order.userId });
//                 const transaction = { amount: refundAmount, paymentMethod: order.paymentMethod };

//                 if (wallet) {
//                     wallet.transactions.push(transaction);
//                     wallet.currentBalance += refundAmount;
//                     await wallet.save();
//                 } else {
//                     await Wallet.create({ userId: order.userId, currentBalance: refundAmount, transactions: [transaction] });
//                 }
//             }
//         } else if (action === 'decline') {
//             order.status = 'Return Request Declined';
//         }

//         await order.save();
//         res.status(200).json(order);
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).json({ success: false, message: 'Internal Server Error' });
//     }
// };

const updateReturnRequest = async (req, res) => {
    try {
        const orderId = req.params.id;
        const action = req.body.action;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (action === 'accept') {
            order.status = 'Returned';
            order.is_return = true;

            // Update the stock for each product in the order
            for (const item of order.products) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }

            const refundAmount = order.totalPrice;
            const wallet = await Wallet.findOne({ userId: order.userId });
            const transaction = { amount: refundAmount, paymentMethod: order.paymentMethod };

            if (wallet) {
                wallet.transactions.push(transaction);
                wallet.currentBalance += refundAmount;
                await wallet.save();
            } else {
                await Wallet.create({ userId: order.userId, currentBalance: refundAmount, transactions: [transaction] });
            }
        } else if (action === 'decline') {
            order.status = 'Return Request Declined';
        }

        await order.save();
        res.status(200).json(order);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


module.exports={
    loadReturnOrders,
    updateReturnRequest
}