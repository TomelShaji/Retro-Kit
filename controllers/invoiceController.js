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
const htmlPdf = require('html-pdf');
const fs = require('fs');
const path = require('path');

const ejs = require('ejs');

// const createInvoice = async (req, res) => {
//     try {
//         const orderId = req.params.orderId;

//         // Fetch order details from the database
//         const order = await Order.findById(orderId).populate('userId', 'name email phone').populate('products.productId').exec();
        
//         if (!order) {
//             return res.status(404).send('Order not found');
//         }

//         // Render invoice template with order data
//         const invoiceHtml = await ejs.renderFile('views/users/invoice.ejs', { order });

//         // Launch headless Chrome browser
//         const browser = await puppeteer.launch();

//         // Create a new page
//         const page = await browser.newPage();

//         // Set content for the PDF invoice
//         await page.setContent(invoiceHtml);

//         // Generate PDF with Puppeteer
//         const pdfBuffer = await page.pdf({ format: 'A4' });

//         // Close the browser
//         await browser.close();

//         // Set content type and disposition for PDF
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);

//         // Send the PDF buffer as response
//         res.send(pdfBuffer);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// };

const createInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Fetch order details from the database
        const order = await Order.findById(orderId).populate('userId', 'name email phone').populate('products.productId').exec();

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Render invoice template with order data
        const invoiceHtml = await ejs.renderFile('views/users/invoice.ejs', { order });

        // Options for the PDF
        const options = { format: 'A4' };

        // Generate PDF with html-pdf
        htmlPdf.create(invoiceHtml, options).toBuffer((err, buffer) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            // Set content type and disposition for PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);

            // Send the PDF buffer as response
            res.send(buffer);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports={
    createInvoice
}