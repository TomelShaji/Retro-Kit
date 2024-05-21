const User = require('../models/userModel');
const UserOtpVerification = require('../models/userOtpVerification');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const randomstring = require('randomstring')
const product = require('../models/productModel');
// const category = require('../models/categoryModel');
const category = require('../models/categoryModel');
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');




const jwt = require('jsonwebtoken');


require('dotenv').config();

const googleClient = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
});


const generateToken = (userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET);
    return token;
};




const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    },
});

const loadLandingPage = async (req, res) => {
    try {
        const products = await product.find({ status: false });
        res.render('landingPage', { products });
    } catch (error) {
        console.log(error.message);
    }
}

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

const sendVerifyMail = async (email, user_id, res) => {
    try {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();  // Generate a random 4-digit OTP

        const mailOptions = {
            from: 'retrokit2005@gmail.com',
            to: email,
            subject: 'For Verification',
            html: `<p>Enter ${otp} in the app to verify your email address.</p>`,
        };
        await UserOtpVerification.deleteOne({ userId: user_id });
        const info = await transporter.sendMail(mailOptions);

        console.log("Email has been sent", info.response);

        // Save the OTP and its expiration timestamp to the database
        const otpVerification = new UserOtpVerification({
            userId: user_id,
            otp: otp,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),  // Set expiration to 5 minutes from now
        });

        await otpVerification.save();
    } catch (error) {
        console.log("Error sending verification email:", error);
        res.render('registration', { message: "Error sending verification email" });
    }
}


const loadRegister = async (req, res) => {
    try {
        res.render('registration');
    } catch (error) {
        console.log(error.message);
    }
}

const insertUser = async (req, res) => {
    try {
        console.log(req.body);

        const email = req.body.email;
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            if (existingUser.is_blocked) {
                res.render('registration', { message: "This email is blocked. Please contact the admin." });
                return; // to stop the execution
            }
            res.render('registration', { message: "Email already exists, try another one" });
            return;
        }

        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;

        if (password !== confirmPassword) {
            res.render('registration', { message: "Passwords do not match." });
            return;
        }

        const spassword = await securePassword(req.body.password);

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: spassword,
            mobile: req.body.mobile,
            is_admin: 0,
        });

        const userData = await user.save();

        if (userData) {

            sendVerifyMail(req.body.email, userData._id, res);
            // res.redirect('/verifyMail');
            res.redirect(`/verifyMail/${userData._id}`);
        }
        else {
            res.render('registration', { message: "Registration has been failed" });
        }
    } catch (error) {
        console.log(error.message);
    }
}

const verifyMail = async (req, res) => {
    try {
        const updateInfo = await User.updateOne({ _id: req.query.id }, { $set: { is_verified: 1 } });
        console.log(updateInfo);
        res.render('verifyMail', { userId: req.params.id });
    } catch (error) {
        console.log(error.message);
    }
}

// Google OAuth callback function
const googleAuthCallback = async (req, res) => {
    try {
        const { code } = req.query;

        // Exchange authorization code for access token
        const { tokens } = await googleClient.getToken(code);
        googleClient.setCredentials(tokens);

        // Retrieve user info using access token
        const { data } = await googleClient.request({
            url: 'https://www.googleapis.com/oauth2/v3/userinfo',
            method: 'GET',
        });

        // Extract user's email and name from the response data
        const email = data.email;
        const name = data.name;

        // Find or create the user based on the Google profile data
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({ email, name });
        }

        // Generate JWT token
        const jwtToken = generateToken(user._id);
        user.jwt_token = jwtToken;
        await user.save();

        // Redirect to home page with JWT token
        res.cookie('jwt', jwtToken, { httpOnly: true });
        res.redirect('/home');
    } catch (error) {
        console.error('Error in Google Auth Callback:', error);
        res.redirect('/login');
    }
};

const googleAuth = async (req, res) => {
    try {
        const redirectUri = 'http://www.theretrokit.shop/google/callback'; // Replace with your actual redirect URI
        const url = googleClient.generateAuthUrl({
            access_type: 'offline',
            scope: ['email', 'profile'],
            redirect_uri: redirectUri // Specify the redirect URI here
        });
        res.redirect(url);
    } catch (error) {
        console.error('Error initiating Google Auth:', error);
        res.redirect('/login');
    }
};



const loginLoad = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}

const resendOtp = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Resend the OTP
        sendVerifyMail(user.email, userId, res);

        res.redirect(`/verifyMail/${userId}`);
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}

const verifyOtp = async (req, res) => {
    try {
        const userId = req.body.userId;
        const enteredOtp = req.body.otp;

        // Retrieve user OTP from the database
        const userOtp = await UserOtpVerification.findOne({ userId: userId });

        if (userOtp && userOtp.otp === enteredOtp && userOtp.expiresAt > new Date()) {
            // OTP is valid, update user verification status
            await User.updateOne({ _id: userId }, { $set: { is_verified: 1 } });

            res.redirect('/login');
        } else {
            
            res.render('verifyMail', { error: "Invalid OTP or OTP has expired", userId: userId });
        }
    } catch (error) {
        console.log(error.message);
        res.render('verifyMail', { error: "An error occurred", userId: userId });
    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });
        if (userData) {
            if (userData.is_blocked) {
                return res.render('login', { message: 'This account is blocked. Please contact the admin.' });
            }
            const passwordMatch = await bcrypt.compare(password, userData.password)
            if (passwordMatch) {
                if (userData.is_verified === 1) {
                    const jwtToken = generateToken(userData._id);
                    await User.updateOne({ _id: userData._id }, { $set: { jwt_token: jwtToken } });
                    res.cookie('jwt', jwtToken, { httpOnly: true });
                    // res.header('Authorization', `Bearer ${token}`);
                    // req.session.user_id = userData._id;
                    res.redirect('/home');
                } else {
                    res.render('login', { message: "Please verify your email" });
                }
            } else {
                res.render('login', { message: "E-mail and Password Incorrect" });
            }
        } else {
            res.render('login', { message: "E-mail and Password Incorrect" });
        }
    } catch (error) {
        console.log(error.message);
    }
}



const forgetLoad = async (req, res) => {
    try {
        res.render('forgetLoad', { message: "" });
    } catch (error) {
        console.log(error.message);
    }
}

const forgetVerify = async (req, res) => {
    try {
        const email = req.body.email;
        const userData = await User.findOne({ email: email });
        if (userData) {

            if (userData.is_verified === 0) {
                res.render("forget", { message: "Please verify your mail" })
            }
            else {
                const randomString = randomstring.generate();
                const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } });
                sendResetPasswordMail(userData.email, userData._id, randomString);
                res.render('forgetLoad', { message: "Please check your mail to reset your password" })
            }
        }
        else {
            res.render('forgetLoad', { message: "email is incorrect" })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const sendResetPasswordMail = async (email, user_id, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.AUTH_EMAIL,
                pass: process.env.AUTH_PASS
            }
        });
        const mailOptions = {
            from: 'retrokit2005@gmail.com',
            to: email,
            subject: 'For Verification',
            html: `<p>Click the link <a href="http://127.0.0.1:3000/changePassword?token=${token}">here</a></p>`,
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Email has been sent to : ", info.response);
            }
        })
    } catch (error) {

    }
}

const changePasswordLoad = async (req, res) => {
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({ token: token });
        if (tokenData) {
            res.render('changePassword', { user_id: tokenData._id })
        }
        else {
            res.render('404', { message: "token is invalid" })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const resetPassword = async (req, res) => {
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;
        const secure_password = await securePassword(password);
        const updatedData = await User.findByIdAndUpdate({ _id: user_id }, { $set: { password: secure_password, token: '' } });
        res.redirect("/login")
    } catch (error) {
        console.log(error.message);
    }
}


const loadHome = async (req, res) => {
    try {
       
        const userId = req.userId;
        if (!userId) {
            return res.redirect('/login');
        }

        const userData = await User.findById(userId);

        if (!userData) {
            return res.redirect('/login');
        }
        

        // Retrieve products
        const products = await product.find({ status: false });

        // Render the home page with user data and products
        res.render('home', { user: userData, products });
    } catch (error) {
        console.log(error.message);
    }
};

const loadShop = async (req, res) => {
    try {
        const { search, price, size, categoryfilter,page } = req.query;
        let query = { status: false };
        const pageLimit = 6;
        const currentPage = parseInt(page) || 1;

        if (search) {
            query = {
                ...query,
                $or: [
                    { name: { $regex: new RegExp(search, 'i') } },
                    { description: { $regex: new RegExp(search, 'i') } },
                ],
            };
        }

        if (price) {
            const [minPrice, maxPrice] = price.split('-');
            query = {
                ...query,
                price: { $gte: minPrice, $lte: maxPrice },
            };
        }

        if (size) {
            query = {
                ...query,
                size: size,
            };
        }

        if (categoryfilter) {
            // Ensure categoryfilter is an array
            const categoriesArray = Array.isArray(categoryfilter) ? categoryfilter : [categoryfilter];
            // Assuming categoryfilter is an array of category names, filter products by category
            const categoryIds = await category.find({ name: { $in: categoriesArray } }).distinct('_id');
            query = { ...query, category_id: { $in: categoryIds } };
        }

        // const products = await product.find(query);
        const categories = await category.find();
        const totalProductCount = await product.countDocuments(query);
        const totalPages = Math.ceil(totalProductCount / pageLimit);
        const skip = (currentPage - 1) * pageLimit;
        const products = await product.find(query).limit(pageLimit).skip(skip);

     

        res.render('shop', { products, categories, totalProductCount, search,totalPages,currentPage });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const loadProductDetail = async (req, res) => {
    try {
        const productId = req.params.id;
        const productData = await product.findById(productId).populate('category_id');;

        if (!productData) {
            res.status(404).send('Product not found');
        }

        res.render('productDetail', { productData });
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async (req, res) => {
    try {
         await User.updateOne({ _id: req.userId }, { $set: { jwt_token: '' } });
    //    const updatedData= await User.findByIdAndUpdate({ _id: user_id }, { $set: { jwt_token: '' } });
        res.clearCookie('jwt');
        res.redirect('/landingPage');

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadLandingPage,
    loadRegister,
    insertUser,
    securePassword,
    verifyMail,
    loginLoad,
    verifyLogin,
    loadHome,
    verifyOtp,
    resendOtp,
    changePasswordLoad,
    resetPassword,
    forgetLoad,
    forgetVerify,
    sendResetPasswordMail,
    loadShop,
    loadProductDetail,
    logout,
    googleAuthCallback,
    googleAuth,
    //googleAuthCallback
}