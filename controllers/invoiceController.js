const User = require('../models/userModel');
const Product = require('../models/productModel');
const cart = require('../models/cartModel');
const Address = require('../models/addressModel'); 
const Order = require('../models/orderModel');
const Wishlist = require('../models/wishlistModel');
const Coupon = require('../models/couponModel');
const Offer = require('../models/categoryOfferModel');
const Category = require('../models/categoryModel')
const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ejs = require('ejs');

const createInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Fetch order details from the database
        const order = await Order.findById(orderId).populate('userId', 'name email phone').populate('products.productId').exec();

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Create a new PDF document
        const doc = new PDFDocument();

        // Pipe the document to a buffer
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);

            // Set content type and disposition for PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);

            // Send the PDF buffer as response
            res.send(pdfBuffer);
        });

        // Add content to the PDF
        doc.fontSize(25).text('Retro Kit Invoice', { align: 'center' });

        doc.fontSize(12).text(`Invoice ID: ${order._id}`);
        doc.text(`Order Date: ${order.createdAt.toDateString()}`);
        doc.text(`Customer Name: ${order.userId.name}`);
        doc.text(`Customer Email: ${order.userId.email}`);
        doc.text(`Customer Phone: ${order.userId.phone}`);
        doc.text(`Address: ${order.address.address}, ${order.address.city}, ${order.address.state}, ${order.address.country}, ${order.address.pincode}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.text(`Total Amount: ${order.totalPrice.toFixed(2)} INR`);

        doc.text('Products:');
        order.products.forEach(product => {
            doc.text(`- ${product.productId.name}: ${product.quantity} x ${product.price.toFixed(2)} INR`);
        });

        doc.text(`Total: ${order.totalPrice.toFixed(2)} INR`);

        // Finalize the PDF and end the document
        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


module.exports={
    createInvoice
}