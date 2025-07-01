const Invoice = require('../Models/InvoiceModel');
const Product = require('../Models/ProductModel');
const { sendSMS } = require('../Utils/SMS');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// ✅ Create Invoice
const createInvoice = async (req, res) => {
  try {
    const { invoiceNumber, customer, items } = req.body;

    if (!invoiceNumber || !customer || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing required invoice fields' });
    }

    // Fetch GST rates for all items from DB
    const itemIds = items.map(i => i.name);
    // We'll match by name for simplicity, but ideally by _id
    const dbProducts = await Product.find({ name: { $in: itemIds } });
    const dbProductMap = {};
    dbProducts.forEach(p => { dbProductMap[p.name] = p; });

    let subtotal = 0;
    let totalGst = 0;
    const invoiceItems = items.map(item => {
      const dbProd = dbProductMap[item.name];
      const gstRate = dbProd ? dbProd.gstRate : 18;
      const itemTotal = item.price * item.quantity;
      const gstAmount = +(itemTotal * gstRate / 100).toFixed(2);
      subtotal += itemTotal;
      totalGst += gstAmount;
      return {
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal,
        gstRate,
        gstAmount
      };
    });
    const grandTotal = subtotal + totalGst;

    const invoice = new Invoice({
      invoiceNumber,
      customer,
      items: invoiceItems,
      gst: +totalGst.toFixed(2),
      grandTotal: +grandTotal.toFixed(2)
    });

    await invoice.save();

    // Update product stock after invoice creation
    for (const item of items) {
      await Product.updateOne(
        { name: item.name },
        { $inc: { quantity: -item.quantity } }
      );
    }

    res.status(201).json(invoice);
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json({ message: 'Failed to create invoice', error: err.message });
  }
};

// ✅ Get All Invoices
const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching invoices', error: err.message });
  }
};

// ✅ Search Invoices
const searchInvoices = async (req, res) => {
  try {
    const { query } = req.query;
    const invoices = await Invoice.find({
      $or: [
        { invoiceNumber: { $regex: query, $options: 'i' } },
        { 'customer.name': { $regex: query, $options: 'i' } }
      ]
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
};

// ✅ Get Invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch invoice', error: err.message });
  }
};

// ✅ Generate Invoice PDF
const generateInvoicePDF = async (invoice) => {
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          .total { text-align: right; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Invoice: ${invoice.invoiceNumber}</h1>
        <p><strong>Customer:</strong> ${invoice.customer.name}</p>
        <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Price</th><th>GST %</th><th>GST Amt</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price}</td>
                <td>${item.gstRate}%</td>
                <td>₹${item.gstAmount.toFixed(2)}</td>
                <td>₹${item.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p class="total">Subtotal: ₹${(invoice.grandTotal - invoice.gst).toFixed(2)}</p>
        <p class="total">Total GST: ₹${invoice.gst}</p>
        <p class="total">Grand Total: ₹${invoice.grandTotal}</p>
      </body>
    </html>
  `;

  const invoiceDir = path.join(__dirname, '../invoices');
  if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir);

  const filePath = path.join(invoiceDir, `${invoice.invoiceNumber}.pdf`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  await page.pdf({ path: filePath, format: 'A4' });
  await browser.close();

  return filePath;
};

// ✅ Send Invoice via SMS
const sendInvoiceSMS = async (req, res) => {
  try {
    const { phone, invoiceId } = req.body;

    if (!phone || !invoiceId) {
      return res.status(400).json({ message: 'Phone and invoice ID are required' });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const message = `Invoice: ${invoice.invoiceNumber}
Customer: ${invoice.customer.name}
Date: ${new Date(invoice.createdAt).toLocaleDateString()}
Items: ${invoice.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
Total: ₹${invoice.grandTotal}
Thank you for shopping!`;

    await sendSMS(phone, message);
    res.json({ message: '✅ Invoice sent successfully via SMS' });
  } catch (err) {
    console.error('❌ Error sending SMS:', err);
    res.status(500).json({ message: 'Failed to send invoice via SMS', error: err.message });
  }
};

// ✅ Export everything
module.exports = {
  createInvoice,
  getAllInvoices,
  searchInvoices,
  getInvoiceById,
  sendInvoiceSMS
};
