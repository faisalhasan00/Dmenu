const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define User schema
const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true // Full name of the user
    },
    email: { 
      type: String, 
      required: true, 
      unique: true // Ensure email is unique for each user
    },
    phone: { 
      type: String, 
      required: true, 
      unique: true // Ensure phone number is unique for each user
    },
    password: { 
      type: String, 
      required: true // Stores the hashed password
    },
    restaurantName: { 
      type: String, 
      required: true // Restaurant name associated with the user
    },
    state: { 
      type: String, 
      required: true // State location of the restaurant
    },
    district: { 
      type: String, 
      required: true // District location of the restaurant
    },
    city: { 
      type: String, 
      required: true // City location of the restaurant
    },
    pinCode: { 
      type: String, 
      required: true // Postal code for the restaurant
    },
    role: { 
      type: String, 
      default: 'user', // Default role for regular users
      enum: ['user', 'admin'] // User can have 'user' or 'admin' roles
    },
  }, 
  { 
    timestamps: true // Automatically adds createdAt and updatedAt fields
  }
);

// Hash password before saving to database
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      return next(error); // Pass error to the next middleware
    }
  }
  next();
});

// Method to validate password
userSchema.methods.isValidPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method to fetch user's own data
userSchema.statics.getOwnData = async function(userId) {
  try {
    return await this.findById(userId).select('-password'); // Exclude password from the returned data
  } catch (error) {
    throw new Error('Unable to fetch user data');
  }
};

// Export User model
module.exports = mongoose.model('User', userSchema);
