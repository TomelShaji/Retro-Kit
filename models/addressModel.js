// const mongoose = require('mongoose');

// const addressSchema = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//     },
//     addresses: [{
//         address: {
//             type: String,
//             required: true
//         },
//         district: {
//             type: String,
//             required: true
//         },
//         city: {
//             type: String,
//             required: true
//         },
//         pincode: {
//             type: String,
//             required: true
//         },
//         state: {
//             type: String,
//             required: true
//         },
//         country: {
//             type: String,
//             required: true
//         }
//     }]
// });

// module.exports = mongoose.model('Address', addressSchema);

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
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
});

module.exports = mongoose.model('Address', addressSchema);
