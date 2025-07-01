const express = require('express');
const router = express.Router();
const Product = require('../Models/ProductModel');
const Invoice = require('../Models/InvoiceModel');
const DashboardController = require('../Controllers/DashboardController');

router.get('/overview', async (req, res) => {
  try {
    const { range, from, to } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate;
    let endDate;

    if (range === 'today') {
      startDate = new Date(today);
    } else if (range === 'week') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === 'month') {
      startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (range === 'custom' && from && to) {
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    }

    const invoiceFilter = {};
    if (range === 'custom' && startDate && endDate) {
      invoiceFilter.createdAt = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      invoiceFilter.createdAt = { $gte: startDate };
    }

    const invoices = await Invoice.find(invoiceFilter);
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const todaysSales = totalRevenue;

    DashboardController.getDashboardOverview(req, {
      json: (data) => {
        data.todaysSales = todaysSales;
        res.json(data);
      }
    }, invoices);
  } catch (err) {
    console.error("Dashboard overview error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
