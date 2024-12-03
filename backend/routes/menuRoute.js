const express = require('express');
const { 
    createMenuItem, 
    getMenuItems, 
    getMenuById, // Added function for "Get by ID"
    updateMenuItem, 
    deleteMenuItem 
} = require('../Controller/menuController');
const authenticateJWT = require('../middlewares/authenticate'); // Updated middleware path

const router = express.Router();

// CRUD Routes
router.post('/', authenticateJWT, createMenuItem); // Create
router.get('/', authenticateJWT, getMenuItems);   // Read All
router.get('/:id', authenticateJWT, getMenuById); // Read by ID
router.put('/:id', authenticateJWT, updateMenuItem); // Update
router.delete('/:id', authenticateJWT, deleteMenuItem); // Delete


module.exports = router;
