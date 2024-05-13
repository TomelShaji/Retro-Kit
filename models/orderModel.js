const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Types.ObjectId,
            ref: 'product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: Number,
        required: true
    },
    address: {
        type: {
            address: {
                type: String,
                required: true
            },
            district: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            pincode: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            },
            country: {
                type: String,
                required: true
            }
        },
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Order Placed',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    couponCode: {
        type: String, // Change the type as per your requirements
        default: null // If no coupon applied
    },
    createdAt: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    },
    is_cancelled: {
        type: Boolean,
        default: false
    },
    is_return: {
        type: Boolean,
        default: false
    },
    reasonForReturn: {
        type: String,
        default: ''
    },
    
});

module.exports = mongoose.model('Order', orderSchema);
