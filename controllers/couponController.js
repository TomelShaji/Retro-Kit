const User = require('../models/userModel');
const Product = require('../models/productModel');
const cart = require('../models/cartModel');
const Address = require('../models/addressModel'); 
const Order = require('../models/orderModel');
const Wishlist = require('../models/wishlistModel');
const Coupon = require('../models/couponModel');

const loadCoupon = async(req,res)=>{
    try {
        const coupons = await Coupon.find();
        res.render('coupon',{coupons});
    } catch (error) {
        console.log(error.message);
    }
}

const loadAddCoupon = async(req,res)=>{
    try {
        res.render('addCoupon');
    } catch (error) {
        console.log(error.message);
    }
}

const addCoupon = async(req,res)=>{
    try {
        const {
            code,discountType,discountAmount,minimumOrderAmount,validFrom,validTo,maxRedemptions,active} = req.body;

            const newCoupon = new Coupon({
                code,
                discountType,
                discountAmount,
                minimumOrderAmount,
                validFrom,
                validTo,
                maxRedemptions,
                active: active === 'on' // Convert 'on' string to boolean
            });

            await newCoupon.save();
            res.redirect('/admin/coupon'); 

    } catch (error) {
        console.log(error.message);
    }
}

const loadEditCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        res.render('editCoupon', { coupon });
    } catch (error) {
        console.log(error.message);
    }
}

const editCoupon = async (req, res) => {
    try {
        const { code, discountType, discountAmount, minimumOrderAmount, validFrom, validTo, maxRedemptions, active } = req.body;

        await Coupon.findByIdAndUpdate(req.params.id, {
            code,
            discountType,
            discountAmount,
            minimumOrderAmount,
            validFrom,
            validTo,
            maxRedemptions,
            active: active === 'on' 
        });

        res.redirect('/admin/coupon');
    } catch (error) {
        console.log(error.message);
    }
}

const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        
        await Coupon.findByIdAndDelete(couponId);
        res.redirect('/admin/coupon'); 
    } catch (error) {
        console.log(error.message);
    }
};


module.exports ={
    loadCoupon,
    loadAddCoupon,
    addCoupon,
    loadEditCoupon,
    editCoupon,
    deleteCoupon
}