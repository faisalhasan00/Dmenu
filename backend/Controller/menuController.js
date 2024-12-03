const MenuItem = require('../models/menuItem');

// Create a new menu item
exports.createMenuItem = async (req, res) => {
    const { name, price, description, category } = req.body;
    const restaurantId = req.user.id; // Ensure authenticateJWT middleware sets req.user correctly.

    try {
        const menuItem = new MenuItem({ name, price, description, category, restaurantId });
        await menuItem.save();
        res.status(201).json({ message: "Menu item created successfully", menuItem });
    } catch (err) {
        console.error("Error creating menu item:", err.message);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};  

// Get all menu items for a restaurant
exports.getMenuItems = async (req, res) => {
    const restaurantId = req.user.id;

    try {
        const menuItems = await MenuItem.find({ restaurantId });
        res.status(200).json(menuItems);
    } catch (err) {
        console.error("Error fetching menu items:", err.message);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};

// Get menu item by ID
exports.getMenuById = async (req, res) => {
    const { id } = req.params;

    try {
        const menuItem = await MenuItem.findById(id);
        if (!menuItem) {
            return res.status(404).json({ error: "Menu item not found" });
        }
        res.status(200).json(menuItem);
    } catch (err) {
        console.error("Error fetching menu item by ID:", err.message);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};

// Update a menu item
exports.updateMenuItem = async (req, res) => {
    const { id } = req.params;
    const { name, price, description, category } = req.body;

    try {
        const updatedMenuItem = await MenuItem.findByIdAndUpdate(
            id,
            { name, price, description, category },
            { new: true, runValidators: true } // Ensure validation is run during updates
        );
        if (!updatedMenuItem) {
            return res.status(404).json({ error: "Menu item not found" });
        }
        res.status(200).json({ message: "Menu item updated successfully", updatedMenuItem });
    } catch (err) {
        console.error("Error updating menu item:", err.message);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};

// Delete a menu item
exports.deleteMenuItem = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedMenuItem = await MenuItem.findByIdAndDelete(id);
        if (!deletedMenuItem) {
            return res.status(404).json({ error: "Menu item not found" });
        }
        res.status(200).json({ message: "Menu item deleted successfully" });
    } catch (err) {
        console.error("Error deleting menu item:", err.message);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};
