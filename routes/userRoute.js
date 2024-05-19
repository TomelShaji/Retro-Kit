const express = require('express');
// const multer = require('multer');
const path = require('path');
const bodyParser =require('body-parser');
const userController = require('../controllers/userController');
const session = require('express-session');
const config = require("../config/config")
const auth = require('../middleware/auth')
const product = require('../models/productModel');
const cartController = require('../controllers/cartController')
const checkoutController = require('../controllers/checkoutController'); 
const userProfileController = require('../controllers/userProfileController')
const jwtUserMiddleware = require('../middleware/jwtUserMiddleware');
const wishlistController = require('../controllers/wishlistController');
const cookieParser = require('cookie-parser');
const walletController = require('../controllers/walletController')
const invoiceController = require('../controllers/invoiceController')
const checkBlockedStatus = require('../middleware/checkBlockedStatus')
const passport = require('passport');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();


const user_route = express();
user_route.use(cookieParser());

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
 

user_route.use((req, res, next) => {
    res.set('cache-control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
});



user_route.use( express.static(path.join(__dirname, 'public')));
user_route.set('view engine','ejs');
user_route.set('views','./views/users');



user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}))

user_route.get('/landingPage',jwtUserMiddleware.redirectAuthenticatedUser,userController.loadLandingPage);

user_route.get('/register',jwtUserMiddleware.redirectAuthenticatedUser,userController.loadRegister);

user_route.post('/register',userController.insertUser);

user_route.get('/verifyMail/:id', userController.verifyMail);
user_route.post('/verifyMail', userController.verifyOtp);

user_route.get('/resendOtp/:id', userController.resendOtp);


// user_route.get('/',userController.loginLoad);
user_route.get('/login',jwtUserMiddleware.redirectAuthenticatedUser,userController.loginLoad);

user_route.post('/login',userController.verifyLogin);



// Google authentication routes

user_route.get('/google/callback', userController.googleAuthCallback);
user_route.get('/google', userController.googleAuth);


//home

user_route.get('/home',jwtUserMiddleware.verifyToken,checkBlockedStatus,userController.loadHome);

user_route.get('/forget', userController.forgetLoad);
user_route.post('/forget', userController.forgetVerify);

user_route.get('/changePassword', userController.changePasswordLoad);
user_route.post('/changePassword', userController.resetPassword);

user_route.get('/shop',jwtUserMiddleware.verifyToken,checkBlockedStatus,userController.loadShop);
user_route.get('/productDetail/:id',userController.loadProductDetail);

//cart

user_route.get('/cart', jwtUserMiddleware.verifyToken,cartController.loadCart);
user_route.post('/addToCart/:productId', jwtUserMiddleware.verifyToken,  cartController.addToCart);
user_route.get('/cart', jwtUserMiddleware.verifyToken, cartController.loadCart);
user_route.post('/addToCart/:productId', jwtUserMiddleware.verifyToken, cartController.addToCart);
user_route.post('/removeFromCart/:productId', jwtUserMiddleware.verifyToken, cartController.removeFromCart);
user_route.post('/updateCartItem/:productId', jwtUserMiddleware.verifyToken, cartController.updateCartItem);
user_route.post('/applyCoupon', jwtUserMiddleware.verifyToken, cartController.applyCoupon);

//checkout Route

user_route.get('/checkout', jwtUserMiddleware.verifyToken,checkoutController.loadCheckout);
user_route.post('/checkout', jwtUserMiddleware.verifyToken, checkoutController.checkout);
user_route.post('/buyNow/:productId', jwtUserMiddleware.verifyToken, checkoutController.buyNow);
user_route.get('/placeOrder/:orderId', jwtUserMiddleware.verifyToken, checkoutController.loadPlaceOrder);
user_route.post('/razorpay/order', jwtUserMiddleware.verifyToken,checkoutController.createRazorpayOrder);
user_route.get('/success',jwtUserMiddleware.verifyToken,checkoutController.loadSuccess);
user_route.get('/failed',checkoutController.loadFailed);
//user_route.post('/applyCoupon',cartController.applyCoupon)



// Profile Routes

user_route.get('/profile', jwtUserMiddleware.verifyToken, userProfileController.loadProfile);
user_route.get('/updateProfile', jwtUserMiddleware.verifyToken, userProfileController.loadUpdateProfile);
user_route.post('/updateProfile', jwtUserMiddleware.verifyToken, userProfileController.updateProfile);

// Address Routes

user_route.get('/address',jwtUserMiddleware.verifyToken,userProfileController.loadAddress)
user_route.get('/addAddress', jwtUserMiddleware.verifyToken, userProfileController.loadAddAddress);
user_route.post('/addAddress', jwtUserMiddleware.verifyToken, userProfileController.addAddress);
user_route.get('/editAddress/:id', jwtUserMiddleware.verifyToken, userProfileController.loadEditAddress);
user_route.post('/editAddress/:id', jwtUserMiddleware.verifyToken, userProfileController.editAddress);
user_route.get('/deleteAddress/:id', jwtUserMiddleware.verifyToken, userProfileController.deleteAddress);


// Password Routes

user_route.get('/password',jwtUserMiddleware.verifyToken,userProfileController.loadPassword);
user_route.post('/password',jwtUserMiddleware.verifyToken,userProfileController.currentPassword);
user_route.get('/updatePassword',jwtUserMiddleware.verifyToken,userProfileController.loadUpdatePassword);
user_route.post('/updatePassword',jwtUserMiddleware.verifyToken,userProfileController.updatePassword);

// order routes

user_route.get('/orders',jwtUserMiddleware.verifyToken,userProfileController.loadOrders);
user_route.put('/cancelOrder/:id', userProfileController.cancelOrder);
user_route.put('/returnProduct/:id', jwtUserMiddleware.verifyToken, userProfileController.returnProduct);
user_route.get('/generateInvoice/:orderId', invoiceController.createInvoice);

// wishlist routes

user_route.get('/wishlist',jwtUserMiddleware.verifyToken,wishlistController.loadWishlist);
user_route.post('/addToWishlist/:productId', jwtUserMiddleware.verifyToken, wishlistController.addToWishlist);
user_route.post('/removeFromWishlist/:productId', jwtUserMiddleware.verifyToken, wishlistController.removeFromWishlist);

// wallet routes

user_route.get('/wallet',jwtUserMiddleware.verifyToken,walletController.loadWallet)


user_route.get('/logout',userController.logout)

module.exports = user_route ;