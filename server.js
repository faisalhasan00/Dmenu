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

// MongoDB Connection URI
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://mohammedfaislahasan:OP8iTmP8ufeoub1J@digim1.bqdmo.mongodb.net/Restaurant?retryWrites=true&w=majority';
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

// Create models
const RestaurantDetails = mongoose.model('RestaurantDetails', restaurantDetailsSchema, 'RestaurantDetails');
const MenuItem = mongoose.model('Menu', menuItemSchema, 'Menu');
const Hotel = mongoose.model('Hotel', hotelSchema);

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

// Fetch menu items
app.get('/api/menu', async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu items:', error);
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

// Use menu routes
app.use('/api/menu', menuRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
