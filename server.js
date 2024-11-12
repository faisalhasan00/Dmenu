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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection URI
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@cluster.mongodb.net/Restaurant?retryWrites=true&w=majority';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schemas
const restaurantDetailsSchema = new mongoose.Schema({
  name: String,
  description: String,
});

const menuItemSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  imageUrl: String,
  isRecommended: Boolean,
});

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  hotelName: { type: String, required: true },
  password: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true },
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  name: { type: String, required: true },
  items: { type: Array, required: true },
  tableNumber: String,
  token: String,
  paymentMethod: String,
});

// Create models
const RestaurantDetails = mongoose.model('RestaurantDetails', restaurantDetailsSchema);
const MenuItem = mongoose.model('Menu', menuItemSchema);
const Hotel = mongoose.model('Hotel', hotelSchema);
const Payment = mongoose.model('Payment', paymentSchema);  // New payment model

// Routes

// Fetch restaurant details
app.get('/api/restaurant', async (req, res) => {
  try {
    const restaurant = await RestaurantDetails.find();
    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Sample route for orders (Mock Data)
app.get('/api/orders', (req, res) => {
  const orders = [
    { id: 1, user: 'Alice', status: 'Pending', total: 20.00, date: '2024-10-01' },
    { id: 2, user: 'Bob', status: 'Completed', total: 35.50, date: '2024-10-02' },
  ];
  res.json(orders);
});

// Register a new hotel
app.post('/register', async (req, res) => {
  const { name, mobile, hotelName, password, city, state, zip, email } = req.body;

  if (!name || !mobile || !hotelName || !password || !city || !state || !zip || !email) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const existingHotel = await Hotel.findOne({ $or: [{ email }, { mobile }] });
    if (existingHotel) {
      return res.status(400).json({ message: 'Hotel with this email or mobile already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newHotel = new Hotel({
      name,
      mobile,
      hotelName,
      password: hashedPassword,
      city,
      state,
      zip,
      email,
    });

    await newHotel.save();
    res.status(201).json({ message: 'Registration successful!' });
  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).json({ message: 'Error saving to database', error });
  }
});

// Login for hotel
app.post('/login', async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ message: 'Both mobile and password are required.' });
  }

  try {
    const hotel = await Hotel.findOne({ mobile });
    if (!hotel) {
      return res.status(400).json({ message: 'Invalid phone number or password.' });
    }

    const isMatch = await bcrypt.compare(password, hotel.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid phone number or password.' });
    }

    res.status(200).json({ message: 'Login successful!' });
  } catch (error) {
    console.error("Error logging in:", error);
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
      paymentMethod: "UPI" // Hardcoded for now, you may update as needed
    });

    await payment.save();
    res.status(201).json({ message: 'Payment data saved successfully!' });
  } catch (error) {
    console.error("Error saving payment data:", error);
    res.status(500).json({ message: 'Error saving payment data', error });
  }
});

// Use menu routes
app.use('/api/menu', menuRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
