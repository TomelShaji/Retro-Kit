const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Types.ObjectId,
        ref: 'product',
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    total: {
        type: Number,
        default: 0
    },

});

const cartSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    items: [cartItemSchema],
    subtotal: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    },
    coupon: {
        code: {
            type: String,
            default: ''
        },
        discount: {
            type: Number,
            default: 0
        }
    }
});

module.exports = mongoose.model('cart', cartSchema);
