// require('dotenv').config(); // Load environment variables from .env file
// const jwt = require('jsonwebtoken');

// const adminJwtMiddleware = (req, res, next) => {
//     // Extract the JWT token from cookies, headers, or query parameters
//     const token = req.cookies.adminAuthToken || req.headers['x-access-token'] || req.query.token;

//     // Check if token is provided
//     if (!token) {
//         return res.status(401).redirect('/admin/login'); // Redirect to admin login page if token is not provided
//     }

//     // Verify the token
//     jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//         if (err) {
//             return res.status(401).redirect('/admin/login'); // Redirect to admin login page if token is invalid
//         }
//         // If token is valid, attach the decoded payload to the request object
//         req.admin = decoded;
//         next();
//     });
// };

// module.exports = adminJwtMiddleware;
const jwt = require('jsonwebtoken');
require('dotenv').config();

const adminJwtMiddleware = (req, res, next) => {
    const token = req.cookies.adminToken;
    if (!token) {
        return res.status(401).redirect('/admin/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.adminData = decoded;
        next();
    } catch (error) {
        return res.status(401).redirect('/admin/login');
    }
};

module.exports = adminJwtMiddleware;

