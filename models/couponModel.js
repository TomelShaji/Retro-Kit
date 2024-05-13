const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true
    },
    discountAmount: {
        type: Number,
        required: true
    },
    minimumOrderAmount: {
        type: Number,
        required: true
    },
    validFrom: {
        type: Date,
        required: true
    },
    // validTo: {
    //     type: Date,
    //     required: true
    // },
    // validFrom: {
    //     type: Date,
    //     required: true,
    //     validate: {
    //         validator: function (value) {
    //             // Check if validFrom is in the future
    //             return value > new Date();
    //         },
    //         message: 'Valid from date must be in the future.'
    //     }
    // },
    validTo: {
        type: Date,
        required: true,
        validate: [
            {
                validator: function (value) {
                    // Check if validTo is after validFrom
                    return value > this.validFrom;
                },
                message: 'Valid to date must be after the valid from date.'
            },
            {
                validator: function (value) {
                    // Check if validTo is in the future
                    return value > new Date();
                },
                message: 'Valid to date must be in the future.'
            }
        ]
    },
    maxRedemptions: {
        type: Number,
        default: null // Set to null for unlimited redemptions
    },
    currentRedemptions: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Coupon', couponSchema);
