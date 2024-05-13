const mongoose = require('mongoose');

const categoryfferSchema = new mongoose.Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    expireAt: {
        type: Date,
        required: true
    },
    is_offer: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('CategoryOffer', categoryfferSchema);
