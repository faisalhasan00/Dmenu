require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const Joi = require('joi');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const menuRoutes = require('./backend/routes/menuRoute');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

// Validate environment variables
if (!JWT_SECRET || !MONGODB_URI) {
    console.error("Error: Missing environment variables.");
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => {
        console.error("MongoDB connection error:", err);
        process.exit(1); // Terminate process if MongoDB fails
    });

// CORS Configuration
const corsOptions = {
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://127.0.0.1:5501'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname, 'frontend')));

// Models

// User Model
const User = mongoose.model("User", new mongoose.Schema({
    fullname: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: String,
    restaurantName: String,
    restaurantId: { type: String, unique: true },
    state: String,
    district: String,
    city: String,
    pincode: String,
}));

// Order Model
const Order = mongoose.model('Order', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],  // Assuming you have a MenuItem model
    totalAmount: Number,
    status: { type: String, default: 'Pending' },
    date: { type: Date, default: Date.now },
}));

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // Check if the Authorization header is missing
    if (!authHeader) {
        console.log("Authorization header missing.");
        return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    // Extract the token from the Authorization header
    const token = authHeader.split(' ')[1]; // Expected format: "Bearer <token>"
    
    // If token is not present after "Bearer"
    if (!token) {
        console.log("No token found.");
        return res.status(401).json({ error: 'Unauthorized: No token found.' });
    }

    // Verify the token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error("JWT Verification Error:", err.message);
            return res.status(403).json({ error: 'Forbidden: Invalid token.' });
        }

        console.log("Decoded JWT:", decoded); // Debugging decoded token
        req.user = decoded; // Attach decoded payload to request
        next(); // Proceed to next middleware/route handler
    });
};


// Fetch Orders Route
app.get('/api/orders', authenticateJWT, async (req, res) => {
    try {
        console.log("User ID:", req.user.id); // Debugging user ID
        const orders = await Order.find({ userId: req.user.id });
        console.log("Fetched orders:", orders); // Debugging orders fetched
        if (!Array.isArray(orders)) {
            return res.status(500).json({ error: 'Invalid orders format. Expected an array.' });
        }
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: 'Failed to fetch orders.' });
    }
});

// Register
app.post('/register', async (req, res) => {
    const schema = Joi.object({
        fullname: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
            "any.only": "Passwords do not match."
        }),
        restaurantName: Joi.string().required(),
        state: Joi.string().required(),
        district: Joi.string().required(),
        city: Joi.string().required(),
        pincode: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { fullname, email, phone, password, restaurantName, state, district, city, pincode } = req.body;

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) return res.status(400).json({ error: "User with this email or phone already exists." });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a unique Restaurant ID
        const restaurantId = `${restaurantName}-${Date.now()}`;

        const user = new User({ fullname, email, phone, password: hashedPassword, restaurantName, restaurantId, state, district, city, pincode });
        await user.save();

        res.status(201).json({ message: "User registered successfully.", restaurantId });
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { phone, password } = req.body;
    try {
        const user = await User.findOne({ phone });
        if (!user) return res.status(400).json({ error: "User not found." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials." });

        const token = jwt.sign(
            { id: user._id, restaurantId: user.restaurantId }, // Include restaurantId in the token
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: "Login successful.", token, restaurantId: user.restaurantId });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});

// Razorpay integration
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Payment order creation route
app.post('/api/payment/order', authenticateJWT, async (req, res) => {
    const { amount, currency = 'INR', receipt } = req.body;

    try {
        const options = {
            amount: amount * 100, // Amount in paise
            currency,
            receipt,
            payment_capture: 1,
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ error: 'Failed to create payment order.' });
    }
});

// Verify payment signature
app.post('/api/payment/verify', authenticateJWT, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    try {
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === razorpay_signature) {
            res.status(200).json({ success: true, message: 'Payment verified successfully!' });
        } else {
            res.status(400).json({ error: 'Payment verification failed.' });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: 'Failed to verify payment.' });
    }
});

// Orders Routes

// Create a new order
app.post('/api/orders', authenticateJWT, async (req, res) => {
    const { items, totalAmount } = req.body;
    try {
        const newOrder = new Order({
            userId: req.user.id,
            items,
            totalAmount,
            status: 'Pending',
        });
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: 'Failed to create order.' });
    }
});

// Menu Routes
app.use('/api/menu', authenticateJWT, menuRoutes);

// Serve Pages
app.get('/frontend/:type/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', req.params.type, req.params[0]));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});
