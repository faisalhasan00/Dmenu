// backend/routes/protectedRoute.js

const express = require('express');
const authenticateToken = require('../middlewares/authenticate'); // Import the middleware
const router = express.Router();

// Protected route example
router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route!', user: req.user }); // `req.user` will contain the decoded user info
});

module.exports = router;
