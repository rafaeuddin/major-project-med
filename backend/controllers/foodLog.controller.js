const FoodLog = require('../models/FoodLog');
const FoodItem = require('../models/FoodItem');
const User = require('../models/User');
const errorHandler = require('../utils/errorHandler');

// Get food logs for a date range
exports.getFoodLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    let query = { userId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    const foodLogs = await FoodLog.find(query)
      .sort({ date: -1 })
      .populate('foods.foodItem');

    return res.status(200).json({
      success: true,
      count: foodLogs.length,
      data: foodLogs
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

// Get single food log by id
exports.getFoodLogById = async (req, res) => {
  try {
    const foodLog = await FoodLog.findById(req.params.id)
      .populate('foods.foodItem');

    if (!foodLog) {
      return res.status(404).json({
        success: false,
        message: 'Food log not found'
      });
    }

    // Check if the log belongs to the user
    if (foodLog.userId.toString() !== req.user.id && req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this food log'
      });
    }

    return res.status(200).json({
      success: true,
      data: foodLog
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

// Create a new food log
exports.createFoodLog = async (req, res) => {
  try {
    const { date, mealType, foods, notes, waterIntake } = req.body;
    
    // Create food log
    const newFoodLog = new FoodLog({
      userId: req.user.id,
      date: date || new Date(),
      mealType,
      foods: foods || [],
      notes,
      waterIntake
    });

    // If foods are provided, calculate nutrition totals
    if (foods && foods.length > 0) {
      // Pre-save hook will calculate the totals
    }

    await newFoodLog.save();

    // Increment usage count for each food item
    if (foods && foods.length > 0) {
      const foodItemIds = foods.map(food => food.foodItem);
      await FoodItem.updateMany(
        { _id: { $in: foodItemIds } },
        { $inc: { usageCount: 1 } }
      );
    }

    return res.status(201).json({
      success: true,
      data: newFoodLog
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

// Update food log
exports.updateFoodLog = async (req, res) => {
  try {
    const { date, mealType, foods, notes, waterIntake } = req.body;
    
    // Find the log first
    let foodLog = await FoodLog.findById(req.params.id);
    
    if (!foodLog) {
      return res.status(404).json({
        success: false,
        message: 'Food log not found'
      });
    }
    
    // Check if the log belongs to the user
    if (foodLog.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this food log'
      });
    }

    // Update fields
    foodLog.date = date || foodLog.date;
    foodLog.mealType = mealType || foodLog.mealType;
    if (foods) foodLog.foods = foods;
    if (notes !== undefined) foodLog.notes = notes;
    if (waterIntake !== undefined) foodLog.waterIntake = waterIntake;

    // Save will trigger pre-save hook to recalculate nutrition
    await foodLog.save();

    return res.status(200).json({
      success: true,
      data: foodLog
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

// Delete food log
exports.deleteFoodLog = async (req, res) => {
  try {
    const foodLog = await FoodLog.findById(req.params.id);
    
    if (!foodLog) {
      return res.status(404).json({
        success: false,
        message: 'Food log not found'
      });
    }
    
    // Check if the log belongs to the user
    if (foodLog.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this food log'
      });
    }

    await foodLog.remove();

    return res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

// Get nutrition summary for a date range
exports.getNutritionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get all logs in date range
    const logs = await FoodLog.find({
      userId,
      date: { $gte: start, $lte: end }
    });

    // Calculate daily totals
    const dailyTotals = {};
    
    logs.forEach(log => {
      const dateString = log.date.toISOString().split('T')[0];
      
      if (!dailyTotals[dateString]) {
        dailyTotals[dateString] = {
          date: dateString,
          calories: 0,
          proteins: 0,
          carbs: 0,
          fats: 0,
          waterIntake: 0
        };
      }
      
      dailyTotals[dateString].calories += log.totalCalories || 0;
      dailyTotals[dateString].proteins += log.totalProteins || 0;
      dailyTotals[dateString].carbs += log.totalCarbs || 0;
      dailyTotals[dateString].fats += log.totalFats || 0;
      dailyTotals[dateString].waterIntake += log.waterIntake || 0;
    });

    // Convert to array and sort by date
    const dailyNutrition = Object.values(dailyTotals).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Calculate averages
    const totalDays = dailyNutrition.length;
    let totals = {
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0,
      waterIntake: 0
    };

    dailyNutrition.forEach(day => {
      totals.calories += day.calories;
      totals.proteins += day.proteins;
      totals.carbs += day.carbs;
      totals.fats += day.fats;
      totals.waterIntake += day.waterIntake;
    });

    const averages = totalDays > 0 ? {
      calories: totals.calories / totalDays,
      proteins: totals.proteins / totalDays,
      carbs: totals.carbs / totalDays,
      fats: totals.fats / totalDays,
      waterIntake: totals.waterIntake / totalDays
    } : totals;

    return res.status(200).json({
      success: true,
      data: {
        dailyNutrition,
        totals,
        averages
      }
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

// Search food items
exports.searchFoodItems = async (req, res) => {
  try {
    const { query, category, limit = 20 } = req.query;
    
    let searchQuery = {};
    
    if (query) {
      searchQuery = { 
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { $text: { $search: query } }
        ]
      };
    }
    
    if (category) {
      searchQuery.category = category;
    }

    const foodItems = await FoodItem.find(searchQuery)
      .sort({ usageCount: -1, name: 1 })
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      count: foodItems.length,
      data: foodItems
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

// Create custom food item
exports.createFoodItem = async (req, res) => {
  try {
    const { name, calories, proteins, carbs, fats, servingSize, servingSizeUnit, servingSizeWeight, category } = req.body;
    
    // Check if a similar food item already exists
    const existingItem = await FoodItem.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'A food item with this name already exists'
      });
    }

    // Create new food item
    const newFoodItem = new FoodItem({
      name,
      calories,
      proteins,
      carbs,
      fats,
      servingSize,
      servingSizeUnit,
      servingSizeWeight,
      category,
      addedBy: req.user.id,
      isVerified: req.user.role === 'admin'
    });

    await newFoodItem.save();

    return res.status(201).json({
      success: true,
      data: newFoodItem
    });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}; 