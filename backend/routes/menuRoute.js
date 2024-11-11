const express = require('express');
const router = express.Router();
const MenuItem = require('../models/menuItem'); // Correct path to MenuItem.js

// GET all menu items
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new menu item
router.post('/', async (req, res) => {
  const { name, description, price, availability } = req.body;
  const menuItem = new MenuItem({ name, description, price, availability });
  try {
    const newItem = await menuItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET a single menu item by ID
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
    res.status(200).json(menuItem);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid menu item ID format' });
    }
    console.error(error);
    res.status(500).json({ message: 'Error retrieving menu item' });
  }
});

// PUT to update a menu item by ID
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedItem = await MenuItem.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!updatedItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.status(200).json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: 'Error updating menu item: ' + error.message });
    }
});

// DELETE a menu item by ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedItem = await MenuItem.findByIdAndDelete(id);
        if (!deletedItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.sendStatus(204); // No Content
    } catch (error) {
        res.status(500).json({ message: 'Error deleting menu item: ' + error.message });
    }
});

module.exports = router;
