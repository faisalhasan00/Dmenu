require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path'); // Import the path module
const menuRoutes = require('./backend/routes/menuRoute'); // Adjust path if necessary

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI || 'your_default_mongo_uri';

// Check environment variables
if (!JWT_SECRET) {
    console.error("Error: Missing JWT_SECRET in environment variables.");
    process.exit(1);
}
if (!MONGODB_URI) {
    console.error("Error: Missing MONGODB_URI in environment variables.");
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

// Configure CORS once with all necessary origins
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://127.0.0.1:5501'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// User Schema and Model
const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    restaurantName: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// Payment Schema and Model
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

// JWT Authentication Middleware
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401); // Unauthorized
    }
};

// Register Route
app.post('/register', async (req, res) => {
    const {
        fullname,
        email,
        phone,
        password,
        confirmPassword,
        restaurantName,
        state,
        district,
        city,
        pincode
    } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            fullname,
            email,
            phone,
            password: hashedPassword,
            restaurantName,
            state,
            district,
            city,
            pincode
        });

        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    try {
        // Find user by phone number
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Create JWT token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        // Send response with token
        res.status(200).json({ message: "Login successful", token });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});



// Dashboard Route
app.get('/frontend/admin/Dashboard', authenticateJWT, (req, res) => {
    // Ensure the path is correctly pointing to the HTML file
    res.sendFile(path.join(__dirname, 'Admin', 'Dashboard.html'));  // Corrected path
});

// Payment Route
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
