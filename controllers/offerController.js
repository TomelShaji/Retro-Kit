const User = require('../models/userModel');
const Product = require('../models/productModel');
const cart = require('../models/cartModel');
const Address = require('../models/addressModel'); 
const Order = require('../models/orderModel');
const Wishlist = require('../models/wishlistModel');
const Coupon = require('../models/couponModel');
const Offer = require('../models/categoryOfferModel');
const Category = require('../models/categoryModel')

const loadOffer = async(req,res)=>{
    try {
        const offers = await Offer.find().populate('category_id')

        res.render('offer',{offers})
    } catch (error) {
        console.log(error.message)
    }
}

const loadAddOffer = async(req,res)=>{
    try {
        const offers = await Offer.find();
        const categories = await Category.find();

        res.render('addOffer',{offers,categories})
    } catch (error) {
        console.log(error.message)
    }
}


const addOffer = async (req, res) => {
    try {
        const { category, discount, expiry } = req.body;

        // Find all products in the given category
        const products = await Product.find({ category_id: category });

        // Store the original prices of products before applying the discount
        const originalPrices = {};
        for (const product of products) {
            originalPrices[product._id] = product.price;
            product.originalPrice = product.price; // Store original price in the product document
            await product.save();
        }

        // Update prices of each product with the discount
        for (const product of products) {
            const discountedPrice = product.price * (1 - discount / 100);
            product.price = discountedPrice;
            await product.save();
        }

        // Save the offer with category, discount, and expiry date
        const newOffer = new Offer({
            category_id: category,
            discount: discount,
            expireAt: expiry,
        });

        await newOffer.save();

        res.redirect('/admin/offer');
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/offer/addOffer');
    }
}

const deleteOffer = async (req, res) => {
    try {
        const offerId = req.params.id;

        // Find and delete the offer
        const offerToDelete = await Offer.findByIdAndDelete(offerId);

        if (!offerToDelete) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        // Find products in the deleted offer's category
        const affectedProducts = await Product.find({ category_id: offerToDelete.category_id });

        // Restore original prices for affected products
        for (const product of affectedProducts) {
            // Check if original price exists in the product document
            if (product.originalPrice !== undefined) {
                product.price = product.originalPrice;
                product.originalPrice = undefined; // Clear original price
                await product.save();
            }
        }

        console.log('Affected Products:', affectedProducts);

        res.redirect('/admin/offer');
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Error deleting offer' });
    }
};

module.exports={
    loadOffer,
    loadAddOffer,
    addOffer,
    deleteOffer
}