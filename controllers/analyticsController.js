const User = require('../models/userModel');
const Product = require('../models/productModel');
const cart = require('../models/cartModel');
const Address = require('../models/addressModel'); 
const Wishlist = require('../models/wishlistModel');
const Coupon = require('../models/couponModel');
const Offer = require('../models/categoryOfferModel');
const Category = require('../models/categoryModel')



const Order = require('../models/orderModel');

const loadAnalytics = async (req, res) => {
    try {
        const salesCount = await Order.find({ status: 'Delivered' }).count().lean();
       // const adminData = await User.findOne({ _id: log });
        res.render('analytics', {  salesCount });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}

const monthlyBarChart = async (req, res) => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  
      const aggregationPipeline = [
        {
          $match: {
            createdAt: { $gte: firstDayOfMonth, $lt: lastDayOfMonth },
          },
        },
        {
          $unwind: "$products",
        },
        {
          $lookup: {
            from: "products", // The name of the Product collection
            localField: "products.productId",
            foreignField: "_id",
            as: "productData",
          },
        },
        {
          $unwind: "$productData",
        },
        {
          $group: {
            _id: "$productData._id",
            name: { $first: "$productData.name" },
            totalQuantity: { $sum: "$products.quantity" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            averageQuantity: { $divide: ["$totalQuantity", "$count"] },
          },
        },
        {
          $sort: { averageQuantity: -1 },
        },
        {
          $limit: 5,
        },
      ];
  
      const top5Products = await Order.aggregate(aggregationPipeline);
  
      const top5AverageQuantities = top5Products.map((product) => parseFloat(product.averageQuantity.toFixed(2)));
  
      const top5ProductNames = top5Products.map((product) => product.name);
  
      console.log("Top 5 Average Quantities:", top5AverageQuantities);
      console.log("Corresponding Product Names:", top5ProductNames);
  
      const response = {
        top5AverageQuantities,
        top5ProductNames,
      };
  
      res.status(200).json(response);
  
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  
  const yearlyBarChart = async (req, res) => {
    try {
      const today = new Date();
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      const lastDayOfYear = new Date(today.getFullYear() + 1, 0, 1);
  
      const aggregationPipeline = [
        {
          $match: {
            createdAt: { $gte: firstDayOfYear, $lt: lastDayOfYear },
          },
        },
        {
          $unwind: "$products",
        },
        {
          $lookup: {
            from: "products", // The name of the Product collection
            localField: "products.productId",
            foreignField: "_id",
            as: "productData",
          },
        },
        {
          $unwind: "$productData",
        },
        {
          $group: {
            _id: "$productData._id",
            name: { $first: "$productData.name" },
            totalQuantity: { $sum: "$products.quantity" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            averageQuantity: { $divide: ["$totalQuantity", "$count"] },
          },
        },
        {
          $sort: { averageQuantity: -1 },
        },
        {
          $limit: 5,
        },
      ];
  
      const top5Products = await Order.aggregate(aggregationPipeline);
  
      const top5AverageQuantities = top5Products.map((product) => parseFloat(product.averageQuantity.toFixed(2)));
      const top5ProductNames = top5Products.map((product) => product.name);
  
      console.log("Top 5 Average Quantities:", top5AverageQuantities);
      console.log("Corresponding Product Names:", top5ProductNames);
  
      const response = {
        top5AverageQuantities,
        top5ProductNames,
      };
  
      res.status(200).json(response);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  const monthlyAreaChart = async (req, res) => {
    try {
  
      const getMonthlyCounts = async () => {
        const today = new Date();
        const year = today.getFullYear();
        const monthlySalesCounts = [];
        const monthlyPurchaseCounts = [];
        const monthLabels = [];
  
        const targetYear = 2023; // Change this to the desired year
  
        const startOfYear = new Date(targetYear, 0, 1);
        const endOfYear = new Date(targetYear + 1, 0, 0);
  
        const minMonth = await Order.find({ createdAt: { $gte: startOfYear, $lt: endOfYear } }).sort({ createdAt: 1 }).limit(1).then(orders => orders[0]?.createdAt.getMonth());
        const maxMonth = await Order.find({ createdAt: { $gte: startOfYear, $lt: endOfYear } }).sort({ createdAt: -1 }).limit(1).then(orders => orders[0]?.createdAt.getMonth());
  
        console.log(minMonth);
        console.log(maxMonth);
  
  
  
        console.log(minMonth);
        console.log(maxMonth);
        if (minMonth === undefined || maxMonth === undefined) {
          // No data available, handle accordingly
          return {
            monthlyPurchaseCounts,
            monthlySalesCounts,
            monthLabels
          };
        }
  
        for (let month = minMonth; month <= maxMonth; month++) {
          const firstDayOfMonth = new Date(year, month, 1);
          const lastDayOfMonth = new Date(year, month + 1, 0);
  
          const purchaseCount = await Order.find({
            createdAt: { $gte: firstDayOfMonth, $lt: lastDayOfMonth }
          }).count();
  
          const salesCount = await Order.find({
            createdAt: { $gte: firstDayOfMonth, $lt: lastDayOfMonth },
            status: 'Delivered'
          }).count();
  
          monthlyPurchaseCounts.push(purchaseCount);
          monthlySalesCounts.push(salesCount);
          monthLabels.push(firstDayOfMonth.toLocaleString('en-US', { month: 'long' }));
        }
  
        return {
          monthlyPurchaseCounts,
          monthlySalesCounts,
          monthLabels
        };
      };
  
      // Example usage
      const result = await getMonthlyCounts();
      console.log("Monthly Purchase Counts:", result.monthlyPurchaseCounts);
      console.log("Monthly Sales Counts:", result.monthlySalesCounts);
      console.log("Month Labels:", result.monthLabels);
  
      const response = {
        purchase: result.monthlyPurchaseCounts,
        sales: result.monthlySalesCounts,
        months: result.monthLabels
      }
      res.status(200).json(response);
  
    } catch (err) {
      console.log(err.message);
    }
  }
  
  const yearlyAreaChart = async (req, res) => {
    try {
      const getYearlyCounts = async () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const startYear = 2019;
        const yearlySalesCounts = [];
        const yearlyPurchaseCounts = [];
        const yearLabels = [];
  
        for (let year = startYear; year <= currentYear; year++) {
          const firstDayOfYear = new Date(year, 0, 1)
          const lastDayOfYear = new Date(year + 1, 0, 0)
  
          const purchaseCount = await Order.find({
            createdAt: { $gte: firstDayOfYear, $lt: lastDayOfYear }
          }).count();
  
          const salesCount = await Order.find({
            createdAt: { $gte: firstDayOfYear, $lt: lastDayOfYear },
            status: 'Delivered'
          }).count();
  
          yearlyPurchaseCounts.push(purchaseCount);
          yearlySalesCounts.push(salesCount);
          yearLabels.push(year.toString());
        }
  
        return {
          yearlyPurchaseCounts,
          yearlySalesCounts,
          yearLabels
        };
      };
  
      // Example usage
      const result = await getYearlyCounts();
      console.log("Yearly Purchase Counts:", result.yearlyPurchaseCounts);
      console.log("Yearly Sales Counts:", result.yearlySalesCounts);
      console.log("Year Labels:", result.yearLabels);
  
      const response = {
        purchase: result.yearlyPurchaseCounts,
        sales: result.yearlySalesCounts,
        months: result.yearLabels
      };
      res.status(200).json(response);
  
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Internal Server Error');
    }
  };
  
  const piechart = async (req, res) => {
    try {
      // Fetch data from the database or calculate as needed
      const pieChartData = await Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);
  
      const labels = pieChartData.map(data => data._id);
      const series = pieChartData.map(data => data.count);
  
      res.json({ labels, series });
    } catch (error) {
      console.error('Error fetching pie chart data:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  const linechart = async (req,res)=>{
    try {
      const categoryId = req.query.categoryId;
    
      const productFilter = categoryId ? { category_id: categoryId } : {};
      
      const orders = await Order.find().populate({
        path: 'products.productId',
        match: productFilter,
      });
    
      const lineChartData = {
        categories: [],
        data: [],
      };
    
      orders.forEach((order) => {
        order.products.forEach((productOrder) => {
          const product = productOrder.productId;
    
          // Check if product is not null or undefined
          if (product) {
            const quantity = productOrder.quantity;
    
            if (!categoryId || (product.category_id && product.category_id.toString() === categoryId)) {
              if (!lineChartData.categories.includes(product.name)) {
                lineChartData.categories.push(product.name);
              }
    
              const dataIndex = lineChartData.categories.indexOf(product.name);
              if (lineChartData.data[dataIndex]) {
                lineChartData.data[dataIndex] += quantity;
              } else {
                lineChartData.data[dataIndex] = quantity;
              }
            }
          }
        });
      });
    
      res.json(lineChartData);
    } catch (error) {
      console.error('Error fetching line chart data:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }



module.exports = {
    loadAnalytics,
    monthlyBarChart,
    yearlyBarChart,
    monthlyAreaChart,
    yearlyAreaChart,
    piechart,
    linechart
}

  