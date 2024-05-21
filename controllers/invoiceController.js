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
        doc.fontSize(20)
        .text('Retro Kit', 110, 57,{align:'left'})
        .moveDown();

    // Add the invoice title and order details
    doc.fontSize(25).text('Invoices', { align: 'right' });

    doc.fontSize(12).text(`Invoice ID: ${order._id}`, { align: 'right' });
    doc.text(`Order Date: ${order.createdAt.toDateString()}`, { align: 'right' });
    doc.moveDown();

    // Add customer details
    doc.fontSize(14).text('Bill To:', 50, 200)
        .fontSize(12).text(`${order.name}`, { continued: true })
        .text(`\n${order.address.address}, ${order.address.city}`)
        .text(`${order.address.state}, ${order.address.country} - ${order.address.pincode}`)
        .text(`Phone: ${order.mobile}`)
        .moveDown();

    // Add payment method and total amount
    doc.fontSize(14).text('Payment Method:', 50, doc.y)
        .fontSize(12).text(order.paymentMethod)
        .moveDown();

    doc.fontSize(14).text('Total Amount:', 50, doc.y)
        .fontSize(12).text(`${order.totalPrice.toFixed(2)} INR`)
        .moveDown();

    // Add a table for the products
    doc.fontSize(14).text('Products', 50, doc.y);
    const tableTop = doc.y + 10;

    // Table headers
    doc.fontSize(12).text('Item', 50, tableTop)
        .text('Quantity', 250, tableTop, { width: 90, align: 'right' })
        .text('Price', 340, tableTop, { width: 90, align: 'right' })
        .text('Total', 430, tableTop, { width: 90, align: 'right' });

    // Add a line below headers
    doc.moveTo(50, tableTop + 15)
        .lineTo(520, tableTop + 15)
        .stroke();

    // Table rows
    let itemPosition = tableTop + 30;
    order.products.forEach(product => {
        doc.fontSize(12).text(product.productId.name, 50, itemPosition)
            .text(product.quantity, 250, itemPosition, { width: 90, align: 'right' })
            .text(product.price.toFixed(2), 340, itemPosition, { width: 90, align: 'right' })
            .text((product.quantity * product.price).toFixed(2), 430, itemPosition, { width: 90, align: 'right' });

        itemPosition += 25;
    });

    // Add a line below the products
    doc.moveTo(50, itemPosition + 15)
        .lineTo(520, itemPosition + 15)
        .stroke();

    // Add total price at the bottom
    doc.fontSize(12).text('Total', 340, itemPosition + 30, { width: 90, align: 'right' })
        .text(`${order.totalPrice.toFixed(2)} INR`, 430, itemPosition + 30, { width: 90, align: 'right' });


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