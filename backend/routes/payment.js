// backend/routes/paymentRoutes.js

const express = require('express');
const Payment = require('../models/Payment');

const router = express.Router();

// Create a new payment entry
router.post('/', async (req, res) => {
  const { paymentId, orderId, amount, currency, name, items, tableNumber, token } = req.body;

  try {
    const payment = new Payment({
      paymentId,
      orderId,
      amount,
      currency,
      name,
      items,
      tableNumber,
      token,
    });

    await payment.save();
    res.status(201).json({ message: 'Payment recorded successfully!' });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Error creating payment entry', error });
  }
});

module.exports = router;
