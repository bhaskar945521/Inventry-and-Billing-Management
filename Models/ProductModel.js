const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    default: 'General'
  },
  gstRate: {
    type: Number,
    required: true,
    enum: [0, 5, 12, 18, 28],
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
