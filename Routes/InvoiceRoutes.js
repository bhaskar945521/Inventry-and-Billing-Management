// routes/InvoiceRoutes.js
const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getAllInvoices,
  searchInvoices,
  getInvoiceById,
  sendInvoiceSMS
} = require('../Controllers/InvoiceController');

// ✅ Create Invoice
router.post('/create', createInvoice);

// ✅ Get All Invoices (Invoice History)
router.get('/all', getAllInvoices);

// ✅ Search Invoices
router.get('/search', searchInvoices);

// ✅ Get Invoice by ID (for viewing full invoice)
router.get('/:id', getInvoiceById);

// ✅ Send Invoice via SMS
router.post('/send-sms', sendInvoiceSMS);

module.exports = router;
