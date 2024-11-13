// backend/models/Payment.js

const mongoose = require('mongoose');

// Define Payment schema
const paymentSchema = new mongoose.Schema({
  paymentId: { 
    type: String, 
    required: true 
  },
  orderId: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  items: { 
    type: [String], 
    required: true 
  },
  tableNumber: { 
    type: String, 
    required: true 
  },
  token: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['Pending', 'Completed', 'Failed'], 
    default: 'Pending' 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true 
});

// Create Payment model
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
