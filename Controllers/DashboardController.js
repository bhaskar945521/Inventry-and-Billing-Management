const Product = require('../Models/ProductModel');
const Invoice = require('../Models/InvoiceModel');

exports.getDashboardOverview = async (req, res, filteredInvoices = null) => {
  try {
    const totalProducts = await Product.countDocuments();
    let allInvoices = filteredInvoices;
    if (!allInvoices) allInvoices = await Invoice.find();
    const totalInvoices = allInvoices.length;
    const totalRevenue = allInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const lowStockProducts = await Product.find({ quantity: { $lt: 5 } });
    const recentInvoices = allInvoices.slice(-5).reverse();

    // Total unique customers (by phone)
    const customerSet = new Set(allInvoices.map(inv => inv.customer?.phone || ''));
    customerSet.delete('');
    const totalCustomers = customerSet.size;

    // Average invoice value
    const avgInvoiceValue = allInvoices.length > 0 ? totalRevenue / allInvoices.length : 0;

    // Top 5 products sold
    const productSales = {};
    allInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!productSales[item.name]) productSales[item.name] = 0;
        productSales[item.name] += item.quantity;
      });
    });
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    // Sales trend for last 7 days (for chart)
    const today = new Date();
    const salesTrends = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const dayTotal = allInvoices
        .filter(inv => inv.createdAt.toISOString().slice(0, 10) === dateStr)
        .reduce((sum, inv) => sum + inv.grandTotal, 0);
      return { date: dateStr, total: dayTotal };
    });

    res.json({
      totalProducts,
      totalInvoices,
      totalRevenue,
      lowStockProducts,
      recentInvoices,
      totalCustomers,
      avgInvoiceValue,
      topProducts,
      salesTrends
    });
  } catch (error) {
    res.status(500).json({ error: "Dashboard overview failed" });
  }
};
