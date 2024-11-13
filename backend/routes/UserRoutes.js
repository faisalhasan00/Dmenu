// backend/routes/userRoutes.js

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
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

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, phone, password: hashedPassword, restaurantName, state, district, city, pinCode });

    await newUser.save();
    res.status(201).json({ message: 'Registration successful!' });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ message: 'Error saving to database', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Both phone number and password are required.' });
  }

  try {
    // Find user by phone number
    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid phone number or password.' });
    }

    // Compare the entered password with the hashed password from the database
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Entered Password:", password);
    console.log("Stored Hashed Password:", user.password);
    console.log("Password Match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid phone number or password.' });
    }

    // Generate JWT if successful
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'defaultSecret', { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful!', token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Get current user's details (protected route)
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password'); // Exclude password field
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error retrieving user details:', error);
    res.status(500).json({ message: 'Error retrieving user details', error: error.message });
  }
});

module.exports = router;
