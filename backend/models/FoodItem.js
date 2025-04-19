const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const foodItemSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['fruits', 'vegetables', 'grains', 'protein', 'dairy', 'beverages', 'snacks', 'desserts', 'prepared', 'other'],
    default: 'other'
  },
  // Nutrition information per serving
  calories: {
    type: Number,
    required: [true, 'Calorie information is required'],
    min: 0
  },
  proteins: {
    type: Number,
    default: 0,
    min: 0
  },
  carbs: {
    type: Number,
    default: 0,
    min: 0
  },
  fats: {
    type: Number,
    default: 0,
    min: 0
  },
  fiber: {
    type: Number,
    default: 0,
    min: 0
  },
  sugar: {
    type: Number,
    default: 0,
    min: 0
  },
  // Serving information
  servingSize: {
    type: Number,
    default: 1
  },
  servingUnit: {
    type: String,
    default: 'serving',
    enum: ['g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'piece', 'serving']
  },
  // Additional information
  brand: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  barcode: {
    type: String,
    trim: true
  },
  // Food item visibility
  isPublic: {
    type: Boolean,
    default: false
  },
  // Who created this food item
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Track how often this food is used
  usageCount: {
    type: Number,
    default: 0
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
foodItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create an index for faster searching
foodItemSchema.index({ name: 'text', brand: 'text' });

const FoodItem = mongoose.model('FoodItem', foodItemSchema);

module.exports = FoodItem; 