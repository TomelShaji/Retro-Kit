const User = require('../models/userModel');
const Product = require('../models/productModel');
const cart = require('../models/cartModel');
const Address = require('../models/addressModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');
const Wallet = require('../models/walletModel')
const Razorpay = require('razorpay');

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});
const razorpayKey = process.env.RAZORPAY_ID_KEY;

const loadCheckout = async (req, res) => {
    try {
        const userId = req.userId;
        const productId = req.params.productId;

        const productData = await Product.findById(productId);
        const user = await User.findById(userId).populate('addresses');
        const userCart = await cart.findOne({ userId }).populate('items.productId');
        if (!userCart) {
            // If the user's cart is empty, render the checkout page with an empty cart
            return res.render('checkout', { cart: { items: [], subtotal: 0, total: 0 }, buyNowProduct: productData, razorpayKey: razorpayKey });
        }

        // res.render('checkout', {user, cart: userCart,addresses: user.addresses });
        res.render('checkout', { user, cart: userCart || { items: [], subtotal: 0, total: 0 }, addresses: user.addresses, buyNowProduct: productData, razorpayKey: razorpayKey });

    } catch (error) {
        console.log(error.message);
    }
};

const buyNow = async (req, res) => {
    try {
        const userId = req.userId;
        const productId = req.params.productId;
        const quantity = req.body.quantity || 1;

        const productData = await Product.findById(productId);

        if (!productData) {
            return res.status(400).send('product not found');
        }

        const user = await User.findById(userId).populate('addresses');
        const userCart = await cart.findOne({ userId }).populate('items.productId');
        if (!userCart) {
            return res.render('checkout', { cart: { items: [], subtotal: 0, total: 0 }, addresses: user.addresses, buyNowProduct: productData, quantity, razorpayKey: razorpayKey });
        }
        res.render('checkout', { cart: userCart || { items: [], subtotal: 0, total: 0 }, buyNowProduct: productData, user, addresses: user.addresses, quantity, razorpayKey: razorpayKey });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const checkout = async (req, res) => {
    try {
        console.log(req.body);
        const userId = req.userId;
        const { selectedAddress, paymentMethod, name, mobile, email, buyNowProductId, couponCode, quantity } = req.body;

        const user = await User.findById(userId).populate('addresses');
        const userCart = await cart.findOne({ userId }).populate('items.productId');
        const addressIndex = parseInt(selectedAddress);

        if (!user.addresses || user.addresses.length <= addressIndex) {
            return res.status(400).send('address not taken');
        }

        const selectedAddressObj = user.addresses[addressIndex];



        // Calculate total price 
        let total = 0;
        let orderProducts = [];

        if (buyNowProductId) {
            // Handle "Buy Now" 
            const buyNowProduct = await Product.findById(buyNowProductId);

            if (!buyNowProduct) {
                return res.status(400).send('Bad Request');
            }


            // total += buyNowProduct.price;
            total += buyNowProduct.price * quantity;
            orderProducts.push({
                productId: buyNowProduct._id,
                quantity: quantity,
                price: buyNowProduct.price,
                couponDiscount: 0

            });
        } else if (userCart) {
            // Handle regular cart 
            total = userCart.total;
            orderProducts = userCart.items.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.price,
                couponDiscount: item.productId.couponDiscount
            }));
        } else {
            return res.status(400).send('Bad Request');
        }


        let couponDiscount = 0;

        // Apply coupon if provided
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode });

            if (coupon) {
                // Check if coupon is valid
                const currentDate = new Date();
                if (currentDate < coupon.validFrom || currentDate > coupon.validTo) {
                    return res.status(400).send('Coupon is not valid at this time.');
                }
                // Check if the coupon has reached its maximum redemptions
                if (coupon.maxRedemptions !== null && coupon.currentRedemptions >= coupon.maxRedemptions) {
                    return res.status(400).send('Coupon has reached maximum redemptions.');
                }
                minimumOrderAmount = coupon.minimumOrderAmount;
                if (total < minimumOrderAmount) {
                    return res.status(400).send(`Minimum order amount for this coupon is ₹${minimumOrderAmount}. Please add more items to meet the requirement.`);
                }

                // Adjust total price based on coupon logic (e.g., percentage or fixed discount)
                if (coupon.discountType === 'percentage') {
                    couponDiscount = (total * coupon.discountAmount) / 100;
                    total -= couponDiscount;
                } else if (coupon.discountType === 'fixed') {
                    couponDiscount = coupon.discountAmount;
                    total -= couponDiscount;
                }

                // Decrement current redemptions and save the coupon
                coupon.currentRedemptions += 1;
                await coupon.save();
            }
        }

        //  Pass necessary information to the calculateTotalAmount function
       
        const orderDetails = {
            products: orderProducts,
            quantity: quantity,
            couponCode: couponCode || '',
            couponDiscount: couponDiscount
        };
        const totalAmount = calculateTotalAmount(orderDetails);

     

        if (paymentMethod === 'Cash on Delivery') {
        
            // Handle Cash on Delivery
            const order = new Order({
                userId: user._id,
                products: orderProducts,
                name,
                mobile,
                email,
                address: {
                    address: selectedAddressObj.address,
                    district: selectedAddressObj.district,
                    city: selectedAddressObj.city,
                    pincode: selectedAddressObj.pincode,
                    state: selectedAddressObj.state,
                    country: selectedAddressObj.country,
                },
                paymentMethod,
                quantity: orderProducts.reduce((acc, item) => acc + item.quantity, 0),
                totalPrice: total,
                couponCode: couponCode || null,
                couponDiscount: couponDiscount
            });

            await order.save();

             // Update stock 
             if (buyNowProductId) {
                const product = await Product.findById(buyNowProductId);
                if (product) {
                    product.stock -= quantity;
                    await product.save();
                }
            }

            // Update stock 
            if (userCart) {
                for (const item of userCart.items) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.stock -= item.quantity;
                        await product.save();
                    }
                }

                // Clear  user's cart
                await cart.findOneAndDelete({ userId });
            }


            res.redirect(`/placeOrder/${order._id}`);
        } else if (paymentMethod === 'Wallet') {
            // Handle payment via Wallet
            const wallet = await Wallet.findOne({ userId });
            //console.log('Wallet:', wallet);
            if (!wallet || wallet.currentBalance < totalAmount) {
                return res.status(400).send('Insufficient wallet balance');
            }



            const order = new Order({
                userId: user._id,
                products: orderProducts,
                name,
                mobile,
                email,
                address: {
                    address: selectedAddressObj.address,
                    district: selectedAddressObj.district,
                    city: selectedAddressObj.city,
                    pincode: selectedAddressObj.pincode,
                    state: selectedAddressObj.state,
                    country: selectedAddressObj.country,
                },
                paymentMethod,
                quantity: orderProducts.reduce((acc, item) => acc + item.quantity, 0),
                totalPrice: total,
                couponCode: couponCode || null,
                couponDiscount: couponDiscount
            });

            await order.save();

             // Update stock 
             if (buyNowProductId) {
                const product = await Product.findById(buyNowProductId);
                if (product) {
                    product.stock -= quantity;
                    await product.save();
                }
            }

            // Update stock 
            if (userCart) {
                for (const item of userCart.items) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        product.stock -= item.quantity;
                        await product.save();
                    }
                }

                // Clear  user's cart
                await cart.findOneAndDelete({ userId });

            }
            // console.log('Wallet balance before deduction:', wallet.currentBalance);
            // Deduct the order total from the wallet balance
            wallet.currentBalance -= totalAmount;
            // console.log('Deducting from wallet balance:', totalAmount);

            // Debug log: Log the wallet balance after deduction
            //console.log('Wallet balance after deduction:', wallet.currentBalance);
            await wallet.save();

           // res.redirect('/placeOrder');
           res.redirect(`/placeOrder/${order._id}`);
        } else {

            return res.status(400).send('Invalid payment method');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const loadSuccess = async(req,res)=>{
    try {
        const userId = req.userId;
        const userCart = await cart.findOne({ userId }).populate('items.productId');
 // Find the latest order in the database
 const latestOrder = await Order.findOne().sort({ createdAt: -1 });

 if (!latestOrder) {
     return res.status(404).send('No orders found');
 }

 // Update the status of the latest order to "Order Placed"
 latestOrder.status = 'Order Placed';
 await latestOrder.save();

         // Update stock for items in the user's cart
         if (latestOrder.products.length > 0) {
            for (const product of latestOrder.products) {
                const dbProduct = await Product.findById(product.productId._id);
                if (dbProduct) {
                    dbProduct.stock -= product.quantity;
                    await dbProduct.save();
                }
            }
        }

        // Clear user's cart
        await cart.findOneAndDelete({ userId });


        res.render('success',{ orderId: latestOrder._id })
    } catch (error) {
        console.log(error.message);
    }
};

const loadFailed = async(req,res)=>{
    try {
        res.render('failed')
    } catch (error) {
        console.log(error.message);
    }
}


const createRazorpayOrder = async (req, res) => {
    try {
        console.log("createRazorpayOrder", req.body);
        const userId = req.userId;
        const { totalAmount, currency, name, email, mobile, address, paymentMethod, products, couponCode, couponDiscount } = req.body;

        const options = {
            // key: RAZORPAY_ID_KEY,
            amount: totalAmount * 100, // Amount in paise
            currency: currency,
            receipt: 'receipt#1', // Replace with your own receipt
            payment_capture: 1
        };

        razorpayInstance.orders.create(options, (err, order) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, error: err.message });
            }

            return res.status(200).json({ success: true, order: order });
        });

        const order = new Order({
            userId: userId,
            currency,
            name,
            email,
            mobile,
            address,
            quantity: products.reduce((acc, item) => acc + item.quantity, 0),
            totalPrice: totalAmount,
            couponCode,
            couponDiscount,
            status: 'Payment Pending',
            paymentMethod,
            products
        });

        // Save the order to the database
        const savedOrder = await order.save();



    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};




const calculateTotalAmount = (orderDetails) => {
    // Extract relevant information from the orderDetails object
    const { products, quantity, couponCode, couponDiscount } = orderDetails;

    // Initialize total amount with subtotal
    let totalAmount = products.reduce((acc, product) => acc + (product.price * product.quantity), 0);

    // Adjust total amount if there's a coupon discount
    totalAmount -= couponDiscount;

    // Return the total amount
    return totalAmount;
};

const loadPlaceOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId; // Assuming the order ID is passed as a query parameter

        const order = await Order.findById(orderId).populate('products.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('placeOrder', { order });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
    }
};




module.exports = {
    loadCheckout,
    loadPlaceOrder,
    checkout,
    buyNow,
    createRazorpayOrder,
    loadSuccess,
    loadFailed,
    //applyCoupon
}