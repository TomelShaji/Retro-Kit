const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true
    },
    stock:{
        type: Number,
        required:true
    },
    description:{
        type: String,
        required: true
    },
    size:{
        type: String,
        required: true
    },
    image:{
        type: Array,
        required: true
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true
    },
    status: {
        type: Boolean,
        default: false
    },
    originalPrice: {  // Add originalPrice field
        type: Number
    }
});

module.exports = mongoose.model('product', productSchema);