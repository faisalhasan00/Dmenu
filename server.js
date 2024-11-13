const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import routes
const menuRoutes = require('./backend/routes/menuRoute');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500'],  // Allow both frontend URLs
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection URI
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://mohammedfaislahasan:OP8iTmP8ufeoub1J@digim1.bqdmo.mongodb.net/Restaurant?retryWrites=true&w=majority';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },  // Change to 'name'
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },  // Change to 'phone'
  password: { type: String, required: true },
  restaurantName: { type: String, required: true },  // Change to 'restaurantName'
  state: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, required: true },
  pinCode: { type: String, required: true },
});

// Create model
const User = mongoose.model('User', userSchema);

// Payment schema (define this to use it)
const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true },
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  name: { type: String, required: true },
  items: { type: [String], required: true },
  tableNumber: { type: String, required: true },
  token: { type: String, required: true },
});

const Payment = mongoose.model('Payment', paymentSchema);

// Routes

// Register a new user
app.post('/register', async (req, res) => {
  console.log('Request Body:', req.body); // Log incoming request for debugging

  const { name, email, phone, password, confirmPassword, restaurantName, state, district, city, pinCode } = req.body;

  if (!name || !email || !phone || !password || !confirmPassword || !restaurantName || !state || !district || !city || !pinCode) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or phone number already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      restaurantName,
      state,
      district,
      city,
      pinCode,
    });

    await newUser.save();
    res.status(201).json({ message: 'Registration successful!' });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ message: 'Error saving to database', error });
  }
});

// Login route for user
app.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Both phone number and password are required.' });
  }

  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'Invalid phone number or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid phone number or password.' });
    }

    res.status(200).json({ message: 'Login successful!' });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// Payment route to handle Razorpay payment data
app.post('/api/payment', async (req, res) => {
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
    res.status(201).json({ message: 'Payment data saved successfully!' });
  } catch (error) {
    console.error('Error saving payment data:', error);
    res.status(500).json({ message: 'Error saving payment data', error });
  }
});

// Use menu routes
app.use('/api/menu', menuRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
