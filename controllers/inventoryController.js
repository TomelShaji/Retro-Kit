const User = require('../models/userModel')
const category = require('../models/categoryModel');
const bcrypt = require('bcrypt')
const Product = require('../models/productModel');
const adminAuth = require('../middleware/adminAuth');

const loadInventory = async(req,res)=>{
    try {
        const pageLimit = 7;
       
        // const products = await Product.find();
        // res.render('inventory',{products})
        const page = req.query.page || 1; // Current page, default to 1
       
        // Find total number of products
        const totalProducts = await Product.countDocuments();

        // Calculate total number of pages
        const totalPages = Math.ceil(totalProducts / pageLimit);

        // Calculate offset for skipping documents
        const offset = (page - 1) * pageLimit;

        // Fetch products for the current page
        const products = await Product.find().skip(offset).limit(pageLimit);

        res.render('inventory', { products, totalPages, currentPage: page });
    } catch (error) {
        console.log(error.message);
    }
}

const loadUpdateStock = async(req,res)=>{
    const productId = req.params.id;
    try {
        const product = await Product.findById(productId);
        res.render('updateStock', { product });
    } catch (error) {
        console.log(error.message);
    }
}

const updateStock = async(req,res)=>{
    const productId = req.params.id;
    const newStock = req.body.stock;

    try {
        const product = await Product.findById(productId);
        product.stock = newStock;
        await product.save();
        res.redirect('/admin/inventory');
    } catch (error) {
        console.log(error.message);
    }
}
module.exports={
    loadInventory,
    loadUpdateStock,
    updateStock
}