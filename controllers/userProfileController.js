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

require('dotenv').config();



const loadProfile = async (req, res) => {
    try {
        const userId = req.userId; // Access user ID from JWT middleware

        const user = await User.findById(userId);

        res.render('userProfile', { user, userId });
    } catch (error) {
        console.log(error.message);
    }
};

const loadUpdateProfile = async (req, res) => {
    try {
        const userId = req.userId; 
        const user = await User.findById(userId);

        res.render('editProfile', { user });
    } catch (error) {
        console.log(error.message);
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.userId; 
        const user = await User.findById(userId);

        user.name = req.body.name;

        await user.save();
        res.redirect('/profile');
    } catch (error) {
        console.log(error.message);
    }
};

const loadAddress = async (req, res) => {
    try {
        const userId = req.userId; 
        const user = await User.findById(userId).populate('addresses');
        res.render('address', { addresses: user.addresses });
    } catch (error) {
        console.log(error.message);
    }
};

const loadAddAddress = async (req, res) => {
    try {
        // No need to fetch user data since we're using JWT middleware
        res.render('addAddress');
    } catch (error) {
        console.log(error.message);
    }
};

const addAddress = async (req, res) => {
    try {
        const userId = req.userId; 
        const user = await User.findById(userId);

        const { address, district, city, pincode, state, country } = req.body;

        const newAddress = new Address({
            user: userId,
            address,
            district,
            city,
            pincode,
            state,
            country,
        });
        console.log('New Address:', newAddress);
       
        await newAddress.save();

        // Associate the new address with the user
        user.addresses.push(newAddress);

        // Save the user with the updated addresses array
        await user.save();
      
        res.redirect('/address');
    } catch (error) {
        console.log(error.message);
    }
};

const loadEditAddress = async(req,res)=>{
    try {
        const userId = req.userId;
        const addressId = req.params.id;
        const address = await Address.findById(addressId);
        res.render('editAddress', { address });
    } catch (error) {
        console.log(error.message);
    }
}

const editAddress = async(req,res)=>{
    try {
        const userId = req.userId;
        const addressId = req.params.id;
        const { address, district, city, pincode, state, country } = req.body;

        const updatedAddress = await Address.findByIdAndUpdate(addressId, {
            address,
            district,
            city,
            pincode,
            state,
            country,
        }, { new: true });
        res.redirect('/address');
    } catch (error) {
        console.log(error.message);
    }
}

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        // Implement logic to delete the address by its ID
        await Address.findByIdAndDelete(addressId);
        res.redirect('/address'); // Redirect back to the address page after deletion
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const loadPassword = async(req,res)=>{
    try {
        res.render('password');
    } catch (error) {
        console.log(error.message);
    }
};

const currentPassword = async(req,res)=>{
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        const enteredPassword = req.body.currentPassword;

        const passwordMatch = await bcrypt.compare(enteredPassword,user.password);
        if(passwordMatch){
            res.redirect('/updatePassword');
        }else{
            res.render('password',{error:'Incorrect password'});
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadUpdatePassword = async(req,res)=>{
    try {
        res.render('updatePassword');
    } catch (error) {
        console.log(error.message);
    }
};

const updatePassword = async(req,res)=>{
    try {
        const userId=req.userId;
        const user = await User.findById(userId);

        const newPassword = req.body.newPassword;

        const securePassword= await bcrypt.hash(newPassword,10);

        await User.findByIdAndUpdate(userId,{$set:{password:securePassword}});
        res.redirect('/password')
    } catch (error) {
        console.log(error.message);
    }
};

const loadOrders = async(req,res)=>{
    try {
        const userId = req.userId; 

        
    //     const orders = await Order.find({ userId }).sort({ createdAt: -1 }).populate('products.productId');

    //    res.render('orders',{orders})
    const page = parseInt(req.query.page) || 1; // Get the requested page number from the query parameters, default to page 1 if not provided
    const perPage = 10; // Number of orders per page

    // Count total number of orders
    const totalOrders = await Order.countDocuments({ userId });

    // Calculate total number of pages
    const totalPages = Math.ceil(totalOrders / perPage);

    // Calculate the skip value to paginate results
    const skip = (page - 1) * perPage;

    // Fetch orders for the current page
    const orders = await Order.find({ userId })
        .sort({ createdAt: -1 })
        .populate('products.productId')
        .skip(skip)
        .limit(perPage);

    res.render('orders', { orders, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
}

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.is_cancelled) {
            return res.status(200).json({ success: true, message: 'Order is already cancelled' });
        }

        // Calculate refund amount
        const refundAmount = order.totalPrice;

        // Update the order to mark it as canceled
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: 'Cancelled', is_cancelled: true }, { new: true });

        // Check if payment method is not "Cash on Delivery"
        if (order.paymentMethod !== 'Cash on Delivery') {
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
        }

        if (updatedOrder) {
            res.status(200).json({ success: true, message: 'Order cancelled successfully', updatedOrder });
        } else {
            res.status(500).json({ success: false, message: 'Failed to cancel order' });
        }

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const returnProduct = async (req, res) => {
    try {
        const orderId = req.params.id;

        const reason = req.body.reason;

        const order = await Order.findById(orderId);

        // if order is delivered and not already returned
        if (order && order.status === 'Delivered' && !order.is_return) {
            const refundAmount = order.totalPrice;

            const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: 'Returned', is_return: true,reasonForReturn: reason }, { new: true });

            // Check if payment method is not "Cash on Delivery"
            if (order.paymentMethod !== 'Cash on Delivery') {
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
            }

            res.status(200).json(updatedOrder);
        } else {
            res.status(400).json({ error: 'Invalid request to return the product' });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



module.exports ={
    loadProfile,
    loadUpdateProfile,
    updateProfile,
    loadAddress,
    loadAddAddress,
    addAddress,
    loadPassword,
    currentPassword,
    loadUpdatePassword,
    updatePassword,
    loadOrders,
    cancelOrder,
    returnProduct,
    loadEditAddress,
    editAddress,
    deleteAddress
}