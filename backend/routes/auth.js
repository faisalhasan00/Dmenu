const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming User model is in models/User.js
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, phone, password, confirmPassword, restaurantName, state, district, city, pinCode } = req.body;

  // Check for missing fields
  if (!name || !email || !phone || !password || !confirmPassword || !restaurantName || !state || !district || !city || !pinCode) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Confirm password validation
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  try {
    // Check if user already exists by email or phone
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or phone number already exists.' });
    }

    // Hash password with bcrypt
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Log hashed password for debugging
    console.log("Hashed Password during registration:", hashedPassword);

    // Create and save new user
    const newUser = new User({ name, email, phone, password: hashedPassword, restaurantName, state, district, city, pinCode });
    await newUser.save();

    res.status(201).json({ message: 'Registration successful!' });
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ message: 'Error saving to database', error: error.message });
  }
});

// Login route for user
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  // Check for missing credentials
  if (!phone || !password) {
    return res.status(400).json({ message: 'Both phone number and password are required.' });
  }

  try {
    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'Invalid phone number or password.' });
    }

    // Trim password to remove unwanted spaces
    const trimmedPassword = password.trim();

    // Log entered password and stored password for debugging
    console.log("Entered Password:", trimmedPassword);
    console.log("Stored Password Hash:", user.password);

    // Compare provided password with stored hash
    const isMatch = await bcrypt.compare(trimmedPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid phone number or password.' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful!', token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

module.exports = router;
