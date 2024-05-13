const User = require('../models/userModel');
const product = require('../models/productModel');
const category = require('../models/categoryModel');
const cart = require('../models/cartModel');
const Coupon = require('../models/couponModel')

const loadCart = async (req, res) => {
    try {
        
        const userId = req.userId;
        const userCart = await cart.findOne({ userId: userId }).populate('items.productId');

        if (!userCart) {
            // If  cart is empty, render the cart page with an empty cart
            return res.render('cart', { cart: { items: [], subtotal: 0, total: 0 } });
        }

        
        res.render('cart', { cart: userCart });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const addToCart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.userId; 

    
        let userCart = await cart.findOne({ userId });

        if (!userCart) {
            userCart = new cart({
                userId,
                items: [],
                subtotal: 0,
                total: 0,
            });
        }

        // Check if the product is already in the cart
        const existingItem = userCart.items.find(item => item.productId.toString() === productId);

        if (existingItem) {
            // If  product is already in  cart, update the quantity and total
            existingItem.quantity += 1;
            existingItem.total = existingItem.price * existingItem.quantity;
        } else {
            // If the product is not in the cart, add it
            const productData = await product.findById(productId);

            if (!productData || productData.stock === 0) {
                return res.status(400).json({ message: 'Product not found or out of stock' });
            }

            const newItem = {
                productId: productData._id,
                price: productData.price,
                quantity: 1,
                total: productData.price,
            };

            userCart.items.push(newItem);
        }

        // Update the cart subtotal and total
        userCart.subtotal = userCart.items.reduce((sum, item) => sum + item.total, 0);
        userCart.total = userCart.subtotal;

        // Save the updated cart to the database
        await userCart.save();

        res.redirect('/cart'); 
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.userId;

        
        const userCart = await cart.findOne({ userId });

        if (!userCart) {
            return res.status(400).json({ message: 'User cart not found' });
        }

        //  index of the product in the cart
        const productIndex = userCart.items.findIndex(item => item.productId.toString() === productId);

        if (productIndex === -1) {
            return res.status(400).json({ message: 'Product not found in the cart' });
        }

        // Remove the product from the cart
        userCart.items.splice(productIndex, 1);

        // Update the cart subtotal and total
        userCart.subtotal = userCart.items.reduce((sum, item) => sum + item.total, 0);
        userCart.total = userCart.subtotal;

        
        await userCart.save();

        res.json({ message: 'Product removed from the cart', cart: userCart });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.userId;
        const newQuantity = req.body.quantity;

       
        const userCart = await cart.findOne({ userId }).populate('items.productId');

        if (!userCart) {
            return res.status(400).json({ message: 'User cart not found' });
        }

        
        const cartItem = userCart.items.find(item => item.productId._id.toString() === productId);

        if (!cartItem) {
            return res.status(400).json({ message: 'Product not found in the cart' });
        }

        // Update  quantity
        cartItem.quantity = newQuantity;
        cartItem.total = cartItem.price * newQuantity;

        // Update  subtotal and total
        userCart.subtotal = userCart.items.reduce((sum, item) => sum + item.total, 0);
        userCart.total = userCart.subtotal;

       
        await userCart.save();

       
        res.json({
            updatedSubtotal: userCart.subtotal,
            updatedTotal: userCart.total,
            message: 'Cart item updated successfully',
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;

        // Find the user's cart
        const userId = req.userId;
        const userCart = await cart.findOne({ userId }).populate('items.productId');

        if (!userCart) {
            return res.status(400).json({ message: 'User cart not found' });
        }

        // Find the coupon based on the provided code
        const coupon = await Coupon.findOne({ code: couponCode });

        if (!coupon) {
            return res.status(400).json({ message: 'Invalid coupon code' });
        }

        // Check if the coupon is valid
        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validTo) {
            return res.status(400).json({ message: 'Coupon is not valid at this time' });
        }

        // Check if the coupon is already applied
        if (userCart.coupon && userCart.coupon.code === couponCode) {
            return res.status(400).json({ message: 'Coupon is already applied' });
        }

        // Apply the coupon to the cart
        let discountedTotal;

        // Assuming a fixed discount amount for demonstration
        const fixedDiscountAmount = 10;

        if (coupon.discountType === 'percentage') {
            // Calculate the discounted total based on percentage discount
            const percentageDiscount = (coupon.discountAmount / 100) * userCart.total;
            discountedTotal = userCart.total - percentageDiscount;
        } else if (coupon.discountType === 'fixed') {
            // Calculate the discounted total based on fixed amount discount
            discountedTotal = userCart.total - fixedDiscountAmount;
        }

        // Check if the discounted total meets any minimum order amount requirements
        if (discountedTotal < coupon.minimumOrderAmount) {
            return res.status(400).json({ message: 'Coupon cannot be applied. Minimum order amount not met.' });
        }

        // Check if the maximum redemptions limit has been reached
        if (coupon.maxRedemptions !== null && coupon.currentRedemptions >= coupon.maxRedemptions) {
            return res.status(400).json({ message: 'Coupon cannot be applied. Maximum redemptions reached.' });
        }

        // Increment the current redemptions count for the coupon
        coupon.currentRedemptions++;

        // Update the cart total with the discounted amount
        userCart.total = discountedTotal;

        // Save the updated cart and coupon to the database
        await userCart.save();
        await coupon.save();

        // Redirect the user to the cart page
        res.redirect('/cart');
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error' }); 
    }
};




module.exports={
    loadCart,
    addToCart,
    removeFromCart,
    updateCartItem,
    applyCoupon
}