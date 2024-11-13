// backend/models/Order.js

const mongoose = require('mongoose');

// Define Order schema
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true
    },
    items: [
      {
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending'
    },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },
    tableNumber: {
      type: String, // For dine-in orders; can be null for take-out orders
      required: false
    },
    token: {
      type: String, // Unique token for pickup orders
      required: false
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt timestamps
  }
);

// Export Order model
module.exports = mongoose.model('Order', orderSchema);
