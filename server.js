require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const qrcode = require('qrcode'); // Import the qrcode package
const Joi = require('joi');
const menuRoutes = require('./backend/routes/menuRoute');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI || 'your_default_mongo_uri';

// Validate environment variables
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

// Configure CORS
const corsOptions = {
    origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://127.0.0.1:5501'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
    pincode: { type: String, required: true },
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
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Validation Schema for Registration
const registerSchema = Joi.object({
    fullname: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    restaurantName: Joi.string().required(),
    state: Joi.string().required(),
    district: Joi.string().required(),
    city: Joi.string().required(),
    pincode: Joi.string().required(),
});

// Register Route
app.post('/register', async (req, res) => {
    const { error } = registerSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { fullname, email, phone, password, restaurantName, state, district, city, pincode } = req.body;

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
            pincode,
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
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: "Login successful", token });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Dashboard Route
app.get('/frontend/admin/Dashboard', authenticateJWT, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'Admin', 'Dashboard.html'));
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

// QR Code Generation Route
app.get('/api/qr-code', async (req, res) => {
    try {
        const url = `http://localhost:${PORT}/User/Menu.html`; // Change this to your actual URL
        const qrCode = await qrcode.toDataURL(url);
        res.status(200).json({ qrCode });
    } catch (err) {
        console.error('Error generating QR code:', err);
        res.status(500).json({ message: 'Error generating QR code', err });
    }
});

// Use menu routes
app.use('/api/menu', menuRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
