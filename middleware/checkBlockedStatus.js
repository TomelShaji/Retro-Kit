const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();


const checkBlockedStatus = async (req, res, next) => {
    const jwtToken = req.cookies.jwt;

    if (!jwtToken) {
        return res.status(401).redirect('/login'); // Redirect to login if no token is present
    }

    try {
        const decodedToken = jwt.verify(jwtToken, process.env.JWT_SECRET);

        // Fetch the latest user document from the database using the user ID
        const user = await User.findById(decodedToken.userId);

        if (!user || user.jwt_token !== jwtToken) {
            // If the user is not found or the token doesn't match, consider it unauthorized
            return res.status(401).redirect('/login');
        }

        if (user.is_blocked) {
            // If the user is blocked, clear the JWT cookie and redirect to login with a message
            res.clearCookie('jwt');
            return res.status(403).render('login', { message: 'Your account has been blocked. Please contact the admin.' });
        }

        // You can access the user ID from decodedToken.userId if needed
        req.userId = decodedToken.userId;
        next();
    } catch (err) {
        console.log(err.message);
        return res.status(401).redirect('/login'); // Redirect to login if token is invalid
    }
};

module.exports = checkBlockedStatus;

