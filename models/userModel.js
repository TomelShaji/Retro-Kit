const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
       // required:true
       required: function() {
        return this.password !== undefined;
    }
    },
    mobile:{
        type:String,
        //required:true
        required: function() {
            return this.mobile !== undefined;
        }
    },
    is_admin:{
        type:Number,
        //required:true
        required: function() {
            return this.is_admin !== undefined;
        }
    },
    is_verified:{
        type:Number,
        default:0
    },
    token:{
        type:String,
        default:''
    },
    is_blocked: {
        type: Boolean,
        default: false
    },
    jwt_token:{
        type:String,
        default:""
    },
    addresses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
    }],
});




module.exports = mongoose.model('User',userSchema);



