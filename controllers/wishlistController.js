const User = require('../models/userModel');
const Product = require('../models/productModel');
const cart = require('../models/cartModel');
const Address = require('../models/addressModel'); 
const Order = require('../models/orderModel');
const Wishlist = require('../models/wishlistModel');

const loadWishlist = async(req,res)=>{
    try {
        const userId = req.userId;
        const wishlist = await Wishlist.findOne({ userId }).populate('products.productId');
        res.render('wishlist', { wishlist });
    } catch (error) {
        console.log(error.message);
    }
};

const addToWishlist = async(req,res)=>{
    try {
        const userId = req.userId; 
        const productId = req.params.productId;

       
        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [] });
        }

        // Check if the product is already in the wishlist
        const isProductInWishlist = wishlist.products.some(item => item.productId.equals(productId));

        if (!isProductInWishlist) {
            
            wishlist.products.push({ productId });
            await wishlist.save();
            res.redirect('/wishlist');
        } else {
            res.redirect('/wishlist');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}

const removeFromWishlist = async(req,res)=>{
    try {
        const userId = req.userId;
        const productId = req.params.productId;

        // Remove the product 
        await Wishlist.updateOne(
            { userId },
            { $pull: { products: { productId } } }
        );

        res.redirect('/wishlist');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}

module.exports={
    loadWishlist,
    removeFromWishlist,
    addToWishlist
}