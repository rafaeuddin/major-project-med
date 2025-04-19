const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const foodLogSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  foodItems: [{
    foodItem: {
      type: Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: true
    },
    servingSize: {
      type: Number,
      required: true,
      min: 0.1
    },
    // Pre-calculated values for this specific serving
    calories: Number,
    proteins: Number,
    carbs: Number,
    fats: Number,
    fiber: Number,
    sugar: Number
  }],
  // Totals for the entire log entry
  totalCalories: {
    type: Number,
    default: 0
  },
  totalProteins: {
    type: Number,
    default: 0
  },
  totalCarbs: {
    type: Number,
    default: 0
  },
  totalFats: {
    type: Number,
    default: 0
  },
  totalFiber: {
    type: Number,
    default: 0
  },
  totalSugar: {
    type: Number,
    default: 0
  },
  // Optional notes
  notes: {
    type: String,
    trim: true
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
foodLogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to calculate nutritional totals
foodLogSchema.methods.calculateTotals = function() {
  const totals = {
    calories: 0,
    proteins: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    sugar: 0
  };

  this.foodItems.forEach(item => {
    totals.calories += (item.calories || 0);
    totals.proteins += (item.proteins || 0);
    totals.carbs += (item.carbs || 0);
    totals.fats += (item.fats || 0);
    totals.fiber += (item.fiber || 0);
    totals.sugar += (item.sugar || 0);
  });

  this.totalCalories = totals.calories;
  this.totalProteins = totals.proteins;
  this.totalCarbs = totals.carbs;
  this.totalFats = totals.fats;
  this.totalFiber = totals.fiber;
  this.totalSugar = totals.sugar;

  return totals;
};

// Create indexes for efficient querying
foodLogSchema.index({ user: 1, date: 1 });
foodLogSchema.index({ user: 1, date: 1, mealType: 1 });

const FoodLog = mongoose.model('FoodLog', foodLogSchema);

module.exports = FoodLog; 