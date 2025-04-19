const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const FoodItem = require('../models/FoodItem');
const FoodLog = require('../models/FoodLog');

// Import controllers (we'll create these next)
const foodController = require('../controllers/food.controller');

// ============= FOOD ITEM ROUTES =============

// Get all food items (with pagination and filtering)
router.get('/items', protect, foodController.getFoodItems);

// Get a single food item
router.get('/items/:id', protect, foodController.getFoodItemById);

// Create a new food item (protected, only logged in users)
router.post('/items', protect, foodController.createFoodItem);

// Update a food item (protected, only creator or admin)
router.put('/items/:id', protect, foodController.updateFoodItem);

// Delete a food item (protected, only creator or admin)
router.delete('/items/:id', protect, foodController.deleteFoodItem);

// Get food items by search
router.get('/items/search', protect, foodController.searchFoodItems);

// ============= FOOD LOG ROUTES =============

// Get user's food logs (protected)
router.get('/logs', protect, foodController.getUserFoodLogs);

// Get a single food log
router.get('/logs/:id', protect, foodController.getFoodLogById);

// Create a new food log (protected)
router.post('/logs', protect, foodController.createFoodLog);

// Update a food log (protected)
router.put('/logs/:id', protect, foodController.updateFoodLog);

// Delete a food log (protected)
router.delete('/logs/:id', protect, foodController.deleteFoodLog);

// Get food logs by date
router.get('/logs/date/:date', protect, foodController.getFoodLogsByDate);

// Get daily nutrition summary
router.get('/logs/summary', protect, foodController.getNutritionSummary);

module.exports = router; 