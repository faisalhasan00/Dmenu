const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path if needed

// Middleware to authenticate and verify user
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Authentication token is missing. Please log in.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by decoded userId
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }

    // Check if token is still valid (optional, in case of token invalidation requirement)
    // Add a check here if needed for token expiration or user status

    // Attach user information to request object for access in routes
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Error in authentication:', error);

    // Handle specific JWT errors for better clarity
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please log in.' });
    }

    res.status(401).json({ message: 'Unauthorized access.' });
  }
};

module.exports = authenticate;
