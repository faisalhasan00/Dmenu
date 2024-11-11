const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true, maxlength: 100 },
      description: { type: String, trim: true, maxlength: 500 },
      price: { type: Number, required: true, min: 0 },
      availability: { type: Boolean, default: true },
      category: { type: String, trim: true },
      imageURL: { type: String, trim: true },
      tags: [{ type: String, trim: true }]
    },
    { timestamps: true }
  );
  
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
module.exports = MenuItem;
