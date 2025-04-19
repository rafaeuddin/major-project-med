const FoodItem = require('../models/FoodItem');
const FoodLog = require('../models/FoodLog');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Food Item Controllers
exports.createFoodItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const foodItemData = {
      ...req.body,
      createdBy: req.user.id
    };

    const foodItem = new FoodItem(foodItemData);
    await foodItem.save();

    res.status(201).json({
      success: true,
      data: foodItem
    });
  } catch (error) {
    console.error('Error creating food item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getFoodItems = async (req, res) => {
  try {
    const { query = '', category, page = 1, limit = 20, onlyMine = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let searchQuery = {};
    
    // Add text search if query provided
    if (query && query.trim() !== '') {
      searchQuery.$text = { $search: query };
    }
    
    // Filter by category if provided
    if (category) {
      searchQuery.category = category.toLowerCase();
    }
    
    // Filter by user's own items if requested
    if (onlyMine === 'true') {
      searchQuery.createdBy = req.user.id;
    } else {
      // Show public items and user's own items
      searchQuery.$or = [
        { isPublic: true },
        { createdBy: req.user.id }
      ];
    }
    
    const totalItems = await FoodItem.countDocuments(searchQuery);
    const foodItems = await FoodItem.find(searchQuery)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: foodItems.length,
      total: totalItems,
      totalPages: Math.ceil(totalItems / parseInt(limit)),
      currentPage: parseInt(page),
      data: foodItems
    });
  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getFoodItemById = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);
    
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    // Check if user has access to this food item
    if (!foodItem.isPublic && foodItem.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this food item'
      });
    }
    
    res.status(200).json({
      success: true,
      data: foodItem
    });
  } catch (error) {
    console.error('Error fetching food item:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.updateFoodItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    let foodItem = await FoodItem.findById(req.params.id);
    
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    // Check if user owns this food item
    if (foodItem.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this food item'
      });
    }
    
    foodItem = await FoodItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: foodItem
    });
  } catch (error) {
    console.error('Error updating food item:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.deleteFoodItem = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);
    
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    // Check if user owns this food item
    if (foodItem.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this food item'
      });
    }
    
    await foodItem.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Food item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting food item:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Food Log Controllers
exports.createFoodLog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { date, mealType, foods, waterIntake, notes } = req.body;
    
    // Check if a log already exists for this date and meal type
    let existingLog = await FoodLog.findOne({
      userId: req.user.id,
      date,
      mealType
    });
    
    if (existingLog) {
      // Update existing log
      existingLog.foods = foods || existingLog.foods;
      existingLog.waterIntake = waterIntake !== undefined ? waterIntake : existingLog.waterIntake;
      existingLog.notes = notes || existingLog.notes;
      
      await existingLog.save();
      
      return res.status(200).json({
        success: true,
        data: existingLog,
        message: 'Food log updated successfully'
      });
    }
    
    // Create new log
    const foodLog = new FoodLog({
      userId: req.user.id,
      date,
      mealType,
      foods: foods || [],
      waterIntake: waterIntake || 0,
      notes
    });
    
    await foodLog.save();
    
    res.status(201).json({
      success: true,
      data: foodLog
    });
  } catch (error) {
    console.error('Error creating food log:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getUserFoodLogs = async (req, res) => {
  try {
    const { startDate, endDate, mealType, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let query = { userId: req.user.id };
    
    // Add date range filter
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }
    
    // Add meal type filter
    if (mealType) {
      query.mealType = mealType;
    }
    
    const totalLogs = await FoodLog.countDocuments(query);
    const foodLogs = await FoodLog.find(query)
      .sort({ date: -1, mealType: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: foodLogs.length,
      total: totalLogs,
      totalPages: Math.ceil(totalLogs / parseInt(limit)),
      currentPage: parseInt(page),
      data: foodLogs
    });
  } catch (error) {
    console.error('Error fetching food logs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getFoodLogById = async (req, res) => {
  try {
    const foodLog = await FoodLog.findById(req.params.id);
    
    if (!foodLog) {
      return res.status(404).json({
        success: false,
        message: 'Food log not found'
      });
    }
    
    // Check if user owns this food log
    if (foodLog.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this food log'
      });
    }
    
    res.status(200).json({
      success: true,
      data: foodLog
    });
  } catch (error) {
    console.error('Error fetching food log:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Food log not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.updateFoodLog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    let foodLog = await FoodLog.findById(req.params.id);
    
    if (!foodLog) {
      return res.status(404).json({
        success: false,
        message: 'Food log not found'
      });
    }
    
    // Check if user owns this food log
    if (foodLog.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this food log'
      });
    }
    
    const { foods, waterIntake, notes } = req.body;
    
    if (foods) foodLog.foods = foods;
    if (waterIntake !== undefined) foodLog.waterIntake = waterIntake;
    if (notes !== undefined) foodLog.notes = notes;
    
    await foodLog.save();
    
    res.status(200).json({
      success: true,
      data: foodLog
    });
  } catch (error) {
    console.error('Error updating food log:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Food log not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.deleteFoodLog = async (req, res) => {
  try {
    const foodLog = await FoodLog.findById(req.params.id);
    
    if (!foodLog) {
      return res.status(404).json({
        success: false,
        message: 'Food log not found'
      });
    }
    
    // Check if user owns this food log
    if (foodLog.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this food log'
      });
    }
    
    await foodLog.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Food log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting food log:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Food log not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getNutritionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both startDate and endDate are required'
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const foodLogs = await FoodLog.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
    
    // Group logs by date
    const dailySummaries = {};
    
    foodLogs.forEach(log => {
      const dateKey = log.date.toISOString().split('T')[0];
      
      if (!dailySummaries[dateKey]) {
        dailySummaries[dateKey] = {
          date: dateKey,
          totalCalories: 0,
          totalProteins: 0,
          totalCarbs: 0,
          totalFats: 0,
          waterIntake: 0,
          meals: {}
        };
      }
      
      // Add this log's data to the daily summary
      dailySummaries[dateKey].totalCalories += log.totalCalories || 0;
      dailySummaries[dateKey].totalProteins += log.totalProteins || 0;
      dailySummaries[dateKey].totalCarbs += log.totalCarbs || 0;
      dailySummaries[dateKey].totalFats += log.totalFats || 0;
      dailySummaries[dateKey].waterIntake += log.waterIntake || 0;
      
      // Add meal-specific data
      dailySummaries[dateKey].meals[log.mealType] = {
        calories: log.totalCalories || 0,
        proteins: log.totalProteins || 0,
        carbs: log.totalCarbs || 0,
        fats: log.totalFats || 0
      };
    });
    
    // Convert object to array
    const summaryArray = Object.values(dailySummaries);
    
    // Calculate overall averages
    const overallSummary = summaryArray.reduce((acc, day) => {
      acc.totalDays += 1;
      acc.avgCalories += day.totalCalories;
      acc.avgProteins += day.totalProteins;
      acc.avgCarbs += day.totalCarbs;
      acc.avgFats += day.totalFats;
      acc.avgWaterIntake += day.waterIntake;
      return acc;
    }, {
      totalDays: 0,
      avgCalories: 0,
      avgProteins: 0,
      avgCarbs: 0,
      avgFats: 0,
      avgWaterIntake: 0
    });
    
    if (overallSummary.totalDays > 0) {
      overallSummary.avgCalories /= overallSummary.totalDays;
      overallSummary.avgProteins /= overallSummary.totalDays;
      overallSummary.avgCarbs /= overallSummary.totalDays;
      overallSummary.avgFats /= overallSummary.totalDays;
      overallSummary.avgWaterIntake /= overallSummary.totalDays;
    }
    
    res.status(200).json({
      success: true,
      data: {
        dailySummaries: summaryArray,
        overallSummary
      }
    });
  } catch (error) {
    console.error('Error generating nutrition summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get all food items
 * @route GET /api/food/items
 * @access Private
 */
exports.getAllFoodItems = async (req, res) => {
  try {
    const query = { 
      $or: [
        { isPublic: true },
        { createdBy: req.user.id }
      ]
    };
    
    // Apply search filter if provided
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$and = [
        { $or: [
          { name: searchRegex },
          { brand: searchRegex },
          { description: searchRegex }
        ]}
      ];
    }
    
    // Apply category filter if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const foodItems = await FoodItem.find(query)
      .sort({ usageCount: -1, name: 1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');
      
    const total = await FoodItem.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: foodItems.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: foodItems
    });
  } catch (error) {
    console.error('Error in getAllFoodItems:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get food logs for a user
 * @route GET /api/food/logs
 * @access Private
 */
exports.getUserFoodLogs = async (req, res) => {
  try {
    const query = { user: req.user.id };
    
    // Filter by date
    if (req.query.date) {
      const date = new Date(req.query.date);
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    // Filter by meal type
    if (req.query.mealType) {
      query.mealType = req.query.mealType;
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const foodLogs = await FoodLog.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'foodItems.foodItem',
        select: 'name brand image servingUnit'
      });
      
    const total = await FoodLog.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: foodLogs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: foodLogs
    });
  } catch (error) {
    console.error('Error in getUserFoodLogs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get nutrition summary by date range
 * @route GET /api/food/nutrition/summary
 * @access Private
 */
exports.getNutritionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide startDate and endDate parameters'
      });
    }
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Aggregate nutrition data
    const summary = await FoodLog.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(req.user.id),
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalCalories: { $sum: '$totalCalories' },
          totalProteins: { $sum: '$totalProteins' },
          totalCarbs: { $sum: '$totalCarbs' },
          totalFats: { $sum: '$totalFats' },
          totalFiber: { $sum: '$totalFiber' },
          totalSugar: { $sum: '$totalSugar' },
          mealBreakdown: {
            $push: {
              mealType: '$mealType',
              calories: '$totalCalories',
              proteins: '$totalProteins',
              carbs: '$totalCarbs',
              fats: '$totalFats'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error in getNutritionSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 