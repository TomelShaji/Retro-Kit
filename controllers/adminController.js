const User = require('../models/userModel')
const category = require('../models/categoryModel');
const bcrypt = require('bcrypt')
const Order = require('../models/orderModel')
const Coupon = require('../models/couponModel')
 
const product = require('../models/productModel');
const adminAuth = require('../middleware/adminAuth')
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); 
const jwt = require('jsonwebtoken');

const generateAdminToken = (adminData) => {
     token = jwt.sign(adminData, process.env.JWT_SECRET); 
     return token;
};


const loadLogin = async (req, res) => {
    try {

        
        if (req.cookies.adminToken) {
            return res.redirect('/admin/dashboard');
        }
        res.render('login');
    } catch (error) {
        console.log(error.message)
    }
};

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (userData.is_admin === 0) {
                    res.render('login', { message: 'Email and password are incorrect' });
                } else {
                    // req.session.user_id = userData._id;
                    // req.session.is_admin = true;
                    // res.redirect('/admin/dashboard');
                    const token = generateAdminToken({ email: userData.email });
                    res.cookie('adminToken', token, { httpOnly: true });
                    res.redirect('/admin/dashboard');
                }
            } else {
                res.render('login', { message: 'Email and password are incorrect' });
            }

        } else {
            res.render('login', { message: 'Email and password are incorrect' });
        }
    } catch (error) {
        console.log(error.message);
    }
};



const loadDashboard = async (req, res) => {
    try {

        // Fetch total orders and total amount for the current week
        const thisWeekOrders = await Order.find({
            createdAt: {
                $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
                $lt: new Date()
            }
        }).countDocuments();
        const thisWeekAmount = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
                        $lt: new Date()
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalPrice" }
                }
            }
        ]);

        // Fetch total orders and total amount for the current month
        const thisMonthOrders = await Order.find({
            createdAt: {
                $gte: new Date(new Date().setDate(1)),
                $lt: new Date()
            }
        }).countDocuments();
        const thisMonthAmount = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().setDate(1)),
                        $lt: new Date()
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalPrice" }
                }
            }
        ]);

        // Fetch total orders and total amount for the current year
        const thisYearOrders = await Order.find({
            createdAt: {
                $gte: new Date(new Date().getFullYear(), 0, 1),
                $lt: new Date()
            }
        }).countDocuments();
        const thisYearAmount = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().getFullYear(), 0, 1),
                        $lt: new Date()
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalPrice" }
                }
            }
        ]);

        res.render('dashboard', {
            thisWeekOrders,
            thisWeekAmount: thisWeekAmount.length ? thisWeekAmount[0].totalAmount : 0,
            thisMonthOrders,
            thisMonthAmount: thisMonthAmount.length ? thisMonthAmount[0].totalAmount : 0,
            thisYearOrders,
            thisYearAmount: thisYearAmount.length ? thisYearAmount[0].totalAmount : 0,
            orders: []
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const filterOrders = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;

        // Convert string dates to JavaScript Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Fetch orders within the date range
        // const orders = await Order.find({
        //     createdAt: { $gte: start, $lte: end }
        // });
        const orders = await Order.find({
            createdAt: { $gte: start, $lte: end }
        }).populate('userId', 'name').populate('products');


        // Fetch other dashboard data (e.g., total orders and amounts for this week, month, and year)
        const thisWeekOrders = await Order.find({
            createdAt: {
                $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
                $lt: new Date()
            }
        }).countDocuments();
        const thisWeekAmount = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
                        $lt: new Date()
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalPrice" }
                }
            }
        ]);

         // Fetch total orders and total amount for the current month
         const thisMonthOrders = await Order.find({
            createdAt: {
                $gte: new Date(new Date().setDate(1)),
                $lt: new Date()
            }
        }).countDocuments();
        const thisMonthAmount = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().setDate(1)),
                        $lt: new Date()
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalPrice" }
                }
            }
        ]);

 // Fetch total orders and total amount for the current year
 const thisYearOrders = await Order.find({
    createdAt: {
        $gte: new Date(new Date().getFullYear(), 0, 1),
        $lt: new Date()
    }
}).countDocuments();
const thisYearAmount = await Order.aggregate([
    {
        $match: {
            createdAt: {
                $gte: new Date(new Date().getFullYear(), 0, 1),
                $lt: new Date()
            }
        }
    },
    {
        $group: {
            _id: null,
            totalAmount: { $sum: "$totalPrice" }
        }
    }
]);

        // Render the dashboard view with filtered orders included
        res.render('dashboard', {
            orders,
            thisWeekOrders,
            thisWeekAmount: thisWeekAmount.length ? thisWeekAmount[0].totalAmount : 0,
            thisMonthOrders,
            thisMonthAmount:thisMonthAmount.length ? thisMonthAmount[0].totalAmount:0,
            thisYearOrders,
            thisYearAmount: thisYearAmount.length ? thisYearAmount[0].totalAmount : 0,
            // thisMonthOrders, thisMonthAmount, thisYearOrders, thisYearAmount, etc.
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};



// Define isValidDate function outside the downloadExcel function
function isValidDate(dateString) {
    // Check if the string is in a valid date format
    return !isNaN(Date.parse(dateString));
}


const downloadExcel = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Check if either start or end date is missing
        if (!startDate || !endDate) {
            return res.status(400).send('Start date and end date are required');
        }

        // Check if the date strings are valid
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            return res.status(400).send('Invalid date format');
        }

        // Convert string dates to JavaScript Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Fetch orders within the date range
        const orders = await Order.find({
            createdAt: { $gte: start, $lte: end }
        }).populate('userId', 'name email phone').populate('products.productId').exec();

        // Filter out orders with invalid createdAt values
        const validOrders = orders.filter(order => order.createdAt instanceof Date);

        // Create Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Orders');

        const headers = [
            'Order ID', 
            'Ordered By', 
            'Email', 
            'Phone', 
            'Address', 
            'Product Name',
            'Quantity', 
            'Total Price', 
            'Payment Method', 
            'Coupon Code',
            'Date of Order', 
            'Status'
        ];
        worksheet.addRow(headers);
        
        // Set column widths
        worksheet.columns.forEach((column, index) => {
            let width;
            switch (index) {
                case 0: // Order ID
                    width = 25;
                    break;
                case 1: // Ordered By
                    width = 15;
                    break;
                case 2: // Email
                    width = 20;
                    break;
                case 3: // Phone
                    width = 15;
                    break;
                case 4: // Address
                    width = 60; // Adjust as needed based on the expected length of addresses
                    break;
                case 5: // Product Name
                    width = 40;
                    break;
                case 6: // Quantity
                    width = 5;
                    break;
                case 7: // Total Price
                    width = 10;
                    break;
                case 8: // Payment Method
                    width = 15;
                    break;
                case 9: // Date of Order
                    width = 15;
                    break;
                case 10: // Status
                    width = 15;
                    break;
                default:
                    width = 10; // Default width for other columns
                    break;
            }
            column.width = width;
        });
        

        // Add data rows for valid orders
        validOrders.forEach(order => {
            order.products.forEach(product => {
                worksheet.addRow([
                    order._id, // Order ID
                    order.name, // Ordered By
                    order.userId.email, // Email
                    order.mobile, // Phone
                    order.address.address + ', ' + order.address.city + ', ' + order.address.state + ', ' + order.address.country + ', ' + order.address.pincode, // Address
                    product.productId.name, // Product Name
                    product.quantity, // Quantity
                    product.price, // Total Price
                    order.paymentMethod, // Payment Method
                    order.couponCode ? order.couponCode : 'None',
                    order.createdAt.toDateString(), // Date of Order
                    order.status // Status
                ]);
            });
        });

        // Set content type and disposition
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'orders.xlsx');

        // Save workbook to response
        await workbook.xlsx.write(res);

        // End response
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const downloadPDF = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Check if either start or end date is missing
        if (!startDate || !endDate) {
            return res.status(400).send('Start date and end date are required');
        }

        // Check if the date strings are valid
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            return res.status(400).send('Invalid date format');
        }

        // Convert string dates to JavaScript Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Replace this with your actual code to fetch orders from the database
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).populate('userId', 'name email phone').populate('products.productId').exec();

        // Create a PDF document
        const doc = new PDFDocument();

        // Set content type and disposition for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=orders.pdf');

        // Pipe the PDF document to the response stream
        doc.pipe(res);

        // Add orders data to the PDF
        doc.fontSize(12).text('Filtered Orders', { align: 'center', underline: true });

        
       // Add counter for orders
let orderCounter = 1;

// Add orders data to the PDF
orders.forEach(order => {
    order.products.forEach(product => {
        // Add order number with custom color
        doc.fillColor('blue').text(`${orderCounter++}.`, { width: 20, align: 'left' });

        doc.fillColor('black'); // Reset color to black for other text
        doc.text(`Order ID: ${order._id}`, { width: 400, align: 'left' });
        doc.text(`Ordered By: ${order.name}`, { width: 400, align: 'left' });
        doc.text(`Email: ${order.userId.email}`, { width: 400, align: 'left' });
        doc.text(`Phone: ${order.userId.phone}`, { width: 400, align: 'left' });
        doc.text(`Address: ${order.address.address}, ${order.address.city}, ${order.address.state}, ${order.address.country}, ${order.address.pincode}`, { width: 400, align: 'left' });
        doc.text(`Product: ${product.productId.name}`, { width: 400, align: 'left' });
        doc.text(`Quantity: ${product.quantity}`, { width: 400, align: 'left' });
        doc.text(`Total Price: ${product.price.toFixed(2)}`, { width: 400, align: 'left' });
        doc.text(`Payment Method: ${order.paymentMethod}`, { width: 400, align: 'left' });
        doc.text(`Date of Order: ${order.createdAt.toDateString()}`, { width: 400, align: 'left' });
        doc.text(`Status: ${order.status}`, { width: 400, align: 'left' });
        if (order.couponCode) {
            doc.text(`Coupon Used: ${order.couponCode}`, { width: 400, align: 'left' });
        } else {
            doc.text('Coupon Used: None', { width: 400, align: 'left' });
        }
        doc.moveDown();
    });
});


        // Finalize the PDF
        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


const loadUserManagement = async (req, res) => {
    try {

        const users = await User.find({});
        
        res.render('userManagement', { users });
    
    } catch (error) {
        console.log(error.message);
    }
};

const blockUser = async (req, res) => {
    try {
        const userId = req.query.id;
        await User.findByIdAndUpdate(userId, { $set: { is_blocked: true } });
         
        // const users = await User.find({});
        // res.render('userManagement', { users });
        res.redirect('/admin/userManagement');
    } catch (error) {
        console.log(error.message);
        
        res.redirect('/admin/userManagement');
    }
};

const unblockUser = async (req, res) => {
    try {
        const userId = req.query.id;
        await User.findByIdAndUpdate(userId, { $set: { is_blocked: false } }); 
        // const users = await User.find({});
        // res.render('userManagement', { users });
        res.redirect('/admin/userManagement');
    } catch (error) {
        console.log(error.message);
       
        res.redirect('/admin/userManagement');
    }
};

const loadCategory = async(req,res)=>{
    try {
        const pageLimit = 12;
       
        
        const page = req.query.page || 1; 
       
        
        const totalProducts = await category.countDocuments();

        // Calculate total number of pages
        const totalPages = Math.ceil(totalProducts / pageLimit);

        // Calculate offset for skipping documents
        const offset = (page - 1) * pageLimit;

        const categories = await category.find().skip(offset).limit(pageLimit);
        res.render('category', { categories, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
}

const addCategoryLoad = async (req, res) => {
    try {
        const categories = await category.find();
        
        // Render the 'addCategory' view with the fetched categories and flash messages
        res.render('addCategory', { categories });
    } catch (error) {
        console.log(error.message);
    }
};

const addCategory = async (req, res) => {
    try {
        const categoryName = req.body.name;

        if (!categoryName) {
            return res.render('addCategory', { errorMessage: 'Category name is required', categories: [] });
        }

        const existingCategory = await category.findOne({ name: categoryName });

        if (existingCategory) {
    
            return res.render('addCategory', { errorMessage: 'Category already exists', categories: [] });
        }

        const newCategory = new category({
            name: categoryName,
        });

        await newCategory.save();

        // Redirect to the category view after successfully adding a new category
        res.redirect('/admin/category');
    } catch (error) {
        console.error(error.message);
        // Render the 'addCategory' view with an error message in red
        res.render('addCategory', { errorMessage: 'Error adding category', categories: [] });
    }
};

const editCategoryLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const categoryData = await category.findById({ _id: id });
        if (categoryData) {
            res.render('editCategory', { category: categoryData });
        } else {
            res.redirect('/admin/category');
        }
    } catch (error) {
        console.log(error.message);
    }
};

const editCategory = async (req, res) => {
    try {
        const categoryId = req.body.id;
        const categoryName = req.body.name;

        if (!categoryName) {
            return res.render('editCategory', { errorMessage: 'Category name is required', category: {} });
        }

        const existingCategory = await category.findOne({ name: categoryName, _id: { $ne: categoryId } });

        if (existingCategory) {
            return res.render('editCategory', { errorMessage: 'Category already exists', category: {} });
        }

        const updatedCategory = await category.findByIdAndUpdate(categoryId, { name: categoryName }, { new: true });

        if (updatedCategory) {
            
            res.redirect('/admin/category');
        } else {
            
            res.render('editCategory', { errorMessage: 'Error updating category', category: {} });
        }
    } catch (error) {
        console.error(error.message);
        
        res.render('editCategory', { errorMessage: 'Error updating category', category: {} });
    }
};



const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.query.id;

        if (!categoryId) {
            // If categoryId is not provided, redirect to category page
            return res.redirect('/admin/category');
        }

        const deletedCategory = await category.findByIdAndDelete(categoryId);

        if (deletedCategory) {
            // If category is deleted successfully, redirect to category page
            return res.redirect('/admin/category');
        } else {
            // If category not found or not deleted, redirect to category page
            return res.redirect('/admin/category');
        }
    } catch (error) {
        console.error(error.message);
        // If any error occurs, redirect to category page
        res.redirect('/admin/category');
    }
};


const loadProducts = async(req,res)=>{
    try {
       // const products = await product.find().populate('category_id');
       const pageLimit = 3; // Number of products per page
       const page = req.query.page || 1; // Current page, default to 1

       // Find total number of products
       const totalProducts = await product.countDocuments();

       // Calculate total number of pages
       const totalPages = Math.ceil(totalProducts / pageLimit);

       // Calculate offset for skipping documents
       const offset = (page - 1) * pageLimit;

       // Fetch products for the current page
       const products = await product.find().populate('category_id').skip(offset).limit(pageLimit);

         
        res.render('products', { products, totalPages,currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
}

const loadAddProduct = async(req,res)=>{
    try {
        const categories = await category.find();
        
        res.render('addProduct',{categories});
    } catch (error) {
        console.log(error.message);
    }
}

const addProduct = async(req,res)=>{
    try {
        console.log(req.body);
        const {name,category_id,stock,size,description,price} = req.body;
       
        const newProduct = new product({
            name,
            category_id,
            stock,
            size,
            price,
            originalPrice: price,
            description,
            image:req.files ? req.files.map(file => file.filename) : [],
        });
        await newProduct.save();
        res.redirect('/admin/products')
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/addProduct')
    }
}

const editProductLoad = async(req,res)=>{
    try {
        const productId = req.params.id;
        const productData = await product.findById(productId).populate('category_id').select('name category_id stock size price description image');
        const categories = await category.find();
        
        if (productData) {
            res.render('editProduct', { product: productData, categories });
        } else {
            res.redirect('/admin/products');
        }
    } catch (error) {
        console.log(error.message);
    }
}

const editProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, category_id, stock, size, description, price, deletedImages } = req.body;

        // Find the existing product
        const existingProduct = await product.findById(productId);

        if (!existingProduct) {
            return res.status(404).send("Product not found");
        }

        // Merge existing images with newly uploaded ones
        let updatedImages = existingProduct.image;

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map((file) => file.filename);
            updatedImages = updatedImages.concat(newImages);
        }

        // Remove deleted images
        if (deletedImages) {
            const deletedImageIndices = deletedImages.split(',').map(index => parseInt(index));
            updatedImages = updatedImages.filter((image, index) => !deletedImageIndices.includes(index));
        }

        // Update the product
        const updatedProduct = await product.findByIdAndUpdate(
            productId,
            {
                name,
                category_id,
                stock,
                size,
                price,
                originalPrice: existingProduct.originalPrice !== undefined ? existingProduct.originalPrice : price, // Set originalPrice to existing value or current price
                description,
                image: updatedImages,
            },
            { new: true }
        );

        if (updatedProduct) {
            // Redirect to the product listing or show success message
            res.redirect('/admin/products');
        } else {
            // Handle the case where the update failed
            res.render('editProduct', { errorMessage: 'Error updating product', product: {}, categories: [] });
        }
    } catch (error) {
        console.error(error.message);
        res.render('editProduct', { errorMessage: 'Error updating product', product: {}, categories: [] });
    }
};




const productAvailable = async(req,res)=>{
    try {
        const productId = req.query.id;
        await product.findByIdAndUpdate(productId,{$set:{status: true}});
        res.redirect('/admin/products');
    } catch (error) {
        console.log(error.message);
    }
};

const productNotAvailable = async(req,res)=>{
    try {
        const productId = req.query.id;
        await product.findByIdAndUpdate(productId,{$set:{status: false}});
        res.redirect('/admin/products');
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async(req,res) => {
    try {
        res.cookie('adminToken', '', { expires: new Date(0), httpOnly: true });
        res.redirect('/admin/login');
    
    } catch (error) {
        console.log(error.message)
    }
}



module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    filterOrders,
    downloadExcel,
    downloadPDF,
    loadUserManagement,
    blockUser,
    unblockUser,
    loadCategory,
    addCategoryLoad,
    addCategory,
    editCategoryLoad,
    editCategory,
    deleteCategory,
    loadProducts,
    loadAddProduct,
    addProduct,
    editProductLoad,
    editProduct,
    productAvailable,
    productNotAvailable,
    logout
}