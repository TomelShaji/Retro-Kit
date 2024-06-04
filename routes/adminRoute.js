const express = require('express');
 const session = require('express-session');
const config = require("../config/config");
const bodyParser =require('body-parser');
const flash = require('connect-flash');
const path = require('path');
const multer = require('multer');
const adminAuth = require('../middleware/adminAuth')
const jwtUserMiddleware = require('../middleware/jwtUserMiddleware');
const adminJwtMiddleware = require('../middleware/jwtAdminMiddleware');


const adminController = require('../controllers/adminController');
const inventoryController = require('../controllers/inventoryController');
const adminOrdersController = require('../controllers/adminOrdersController')
const couponController = require('../controllers/couponController');
const offerController = require('../controllers/offerController')
const analyticsController = require('../controllers/analyticsController')
const returnOrdersController = require('../controllers/returnOrdersController')


const admin_route = express();

// admin_route.use(bodyParser.json());
// admin_route.use(bodyParser.urlencoded({extended:true}))

admin_route.use(bodyParser.json({ limit: '50mb' }));
admin_route.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

admin_route.use((req, res, next) => {
    res.set('cache-control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
});

admin_route.use(session({ secret: config.sessionSecret,resave:true,saveUninitialized:true }));
// admin_route.use(flash()); 



admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, path.join(__dirname, '../public/productImages'));
//     },
//     filename: function (req, file, cb) {
//         const name = Date.now() + '-' + file.originalname;
//         cb(null, name);
//     }
// });

// const uploadProductImages = multer({ storage: storage });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/productImages'));
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const uploadProductImages = multer({
    storage: storage
    // limits: { fileSize: 1024 * 1024 * 5 } // Limit file size if needed
});

// admin_route.use(uploadProductImages.array('image', 3))

//login

admin_route.get('/login', adminController.loadLogin);
admin_route.post('/login', adminController.verifyLogin);

admin_route.use(adminJwtMiddleware);

admin_route.get('/dashboard', adminController.loadDashboard);
admin_route.post('/filterOrders', adminController.filterOrders);
admin_route.get('/downloadExcel', adminController.downloadExcel);
admin_route.get('/downloadPDF', adminController.downloadPDF);

//user management

admin_route.get('/userManagement', adminController.loadUserManagement);
admin_route.get('/block-user', adminController.blockUser);
admin_route.get('/unblock-user', adminController.unblockUser);

//category

admin_route.get('/category', adminController.loadCategory);
admin_route.get('/category/addCategory', adminController.addCategoryLoad);
admin_route.post('/addCategory', adminController.addCategory);
admin_route.get('/editCategory', adminController.editCategoryLoad);
admin_route.post('/editCategory', adminController.editCategory);
admin_route.get('/deleteCategory', adminController.deleteCategory);

//products

admin_route.get('/products', adminController.loadProducts);
admin_route.get('/products/addProduct',adminController.loadAddProduct);
admin_route.post('/addProduct',uploadProductImages.array('image', 3), adminController.addProduct);
// admin_route.post('/addProduct', adminController.addProduct);
admin_route.get('/editProduct/:id', adminController.editProductLoad);
admin_route.post('/editProduct/:id', uploadProductImages.array('image', 3), adminController.editProduct);
admin_route.get('/productAvailable', adminController.productAvailable);
admin_route.get('/productNotAvailable', adminController.productNotAvailable);

//inventory/stock

admin_route.get('/inventory',inventoryController.loadInventory);
admin_route.get('/inventory/updateStock/:id', inventoryController.loadUpdateStock);
admin_route.post('/inventory/updateStock/:id', inventoryController.updateStock);

//orders

admin_route.get('/orders',adminOrdersController.loadOrders);
admin_route.get('/orderDetail/:id', adminOrdersController.loadOrderDetail);
admin_route.put('/updateOrderStatus/:id', adminOrdersController.updateOrderStatus);

//coupon

admin_route.get('/coupon',couponController.loadCoupon);
admin_route.get('/coupon/addCoupon',couponController.loadAddCoupon);
admin_route.post('/addCoupon',couponController.addCoupon);
admin_route.get('/coupon/editCoupon/:id',couponController.loadEditCoupon);
admin_route.post('/editCoupon/:id',couponController.editCoupon);
admin_route.get('/coupon/deleteCoupon/:id',couponController.deleteCoupon);

//offer
admin_route.get('/offer',offerController.loadOffer);
admin_route.get('/offer/addOffer', offerController.loadAddOffer);
admin_route.post('/addOffer', offerController.addOffer);
admin_route.get('/offer/deleteOffer/:id', offerController.deleteOffer);

//returnOrders
admin_route.get('/returnOrders',returnOrdersController.loadReturnOrders);
admin_route.put('/updateReturnRequest/:id', returnOrdersController.updateReturnRequest);

//anaytics

admin_route.get('/analytics',analyticsController.loadAnalytics);
//admin_route.post('/analytics',analyticsController.analytics)
admin_route.get('/monthlyBarChart',analyticsController.monthlyBarChart);

admin_route.get('/yearlyBarChart',analyticsController.yearlyBarChart);


// admin_route.get('/weeklyAreaChart', auth.isLogin, chartController.weeklyAreaChart);

admin_route.get('/monthlyAreaChart',analyticsController.monthlyAreaChart);

admin_route.get('/yearlyAreaChart',analyticsController.yearlyAreaChart);

admin_route.get('/piechart', analyticsController.piechart);

admin_route.get('/linechart', analyticsController.linechart);


admin_route.get('/logout', adminController.logout);

admin_route.use((req, res, next) => {
    if (!req.session.adminToken) {
        res.redirect('/admin/login');
    } else {
        next();
    }
});
// admin_route.get('*',function(req,res){
//     res.redirect('/admin')
// })

module.exports =  admin_route;