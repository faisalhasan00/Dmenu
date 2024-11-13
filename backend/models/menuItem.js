// backend/models/MenuItem.js

const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Item name is required'], 
      trim: true, 
      maxlength: [100, 'Name cannot exceed 100 characters'] 
    },
    description: { 
      type: String, 
      trim: true, 
      maxlength: [500, 'Description cannot exceed 500 characters'] 
    },
    price: { 
      type: Number, 
      required: [true, 'Price is required'], 
      min: [0, 'Price cannot be negative'] 
    },
    availability: { 
      type: Boolean, 
      default: true 
    },
    category: { 
      type: String, 
      trim: true, 
      maxlength: [50, 'Category cannot exceed 50 characters'] 
    },
    imageURL: { 
      type: String, 
      trim: true, 
      validate: {
        validator: function(v) {
          return /^(http|https):\/\/[^\s]+$/.test(v);
        },
        message: props => `${props.value} is not a valid URL`
      }
    },
    tags: [{ 
      type: String, 
      trim: true,
      maxlength: [30, 'Tag cannot exceed 30 characters']
    }]
  },
  { 
    timestamps: true 
  }
);

// Create and export the MenuItem model
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
module.exports = MenuItem;
