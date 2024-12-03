const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];  // Extract token from Authorization header
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;  // Attach the decoded user information to the request object
        next();  // Proceed to the next middleware or route handler
    });
};

module.exports = authenticateJWT;

