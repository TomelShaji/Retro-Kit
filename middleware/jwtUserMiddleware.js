const jwt = require('jsonwebtoken');
const User = require('../models/userModel');



const verifyToken = async (req, res, next) => {
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

        // You can access the user ID from decodedToken.userId if needed
        req.userId = decodedToken.userId;
         // Log the user object for debugging
        //  console.log('User Object:', user);
        next();
    } catch (err) {
        console.log(err.message);
        return res.status(401).redirect('/login'); // Redirect to login if token is invalid
    }
};



const redirectAuthenticatedUser = (req, res, next) => {
    const jwtToken = req.cookies.jwt;

    if (jwtToken) {
        // Redirect to home page if the user is already authenticated
        return res.redirect('/home');
    }

    next();
};

module.exports = {
    verifyToken,
    redirectAuthenticatedUser
}