const mongoose = require('mongoose');
// mongoose.connect("mongodb://127.0.0.1:27017/retrokit");
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL,{}).then(()=>{
    console.log("connected to mongo db")
})
.catch(error=>{
    console.log("error connecting to mongodb:",error)
})



const path = require('path');



const express = require("express");
const app = express();

app.use( express.static(path.join(__dirname, 'public')));

//for user routes
const userRoute = require('./routes/userRoute.js');
app.use('/',userRoute);

//for admin routes
const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);

app.listen(3000,function(){
    console.log("Server is running perfectly.....");
});