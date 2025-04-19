import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import openAIService from '../services/OpenAIService';
import '../styles/AddFoodLog.css';

const AddFoodLog = () => {
  const { currentUser, authFetch } = useAuth();
  const navigate = useNavigate();
  const [foodItems, setFoodItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFoodItems, setSelectedFoodItems] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mealType: 'breakfast',
    notes: '',
    waterIntake: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [aiMealAnalysis, setAiMealAnalysis] = useState(false);
  const [mealDescription, setMealDescription] = useState('');
  const [isAnalyzingMeal, setIsAnalyzingMeal] = useState(false);

  // Redirect if not logged in or not a patient
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    
    if (currentUser.role !== 'patient') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Search for food items with OpenAI
  useEffect(() => {
    const searchFoodItems = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Use OpenAI service for food search
        const foodData = await openAIService.getFoodNutritionData(searchTerm);
        
        if (foodData) {
          // Format the response to match our food item structure
          const formattedResult = {
            id: `ai-food-${Date.now()}`,
            name: foodData.foodName,
            brand: foodData.brand || 'Generic',
            calories: foodData.calories,
            proteins: foodData.proteins,
            carbs: foodData.carbs,
            fats: foodData.fats,
            servingUnit: foodData.servingUnit,
            servingSize: foodData.servingSize,
            healthTip: foodData.healthTip
          };
          
          setSearchResults([formattedResult]);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching food items:', error);
        setError('Error searching food items. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchFoodItems();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleMealDescriptionChange = (e) => {
    setMealDescription(e.target.value);
  };

  const addFoodItem = (item) => {
    // Add with default serving size of 1
    setSelectedFoodItems(prev => [
      ...prev, 
      { ...item, servingSize: 1 }
    ]);
    
    // Clear search results
    setSearchTerm('');
    setSearchResults([]);
  };

  const updateServingSize = (index, newSize) => {
    const updatedItems = [...selectedFoodItems];
    updatedItems[index].servingSize = newSize;
    setSelectedFoodItems(updatedItems);
  };

  const removeFoodItem = (index) => {
    setSelectedFoodItems(prev => 
      prev.filter((_, i) => i !== index)
    );
  };

  const calculateTotals = () => {
    return selectedFoodItems.reduce((totals, item) => {
      totals.calories += (item.calories * item.servingSize) || 0;
      totals.proteins += (item.proteins * item.servingSize) || 0;
      totals.carbs += (item.carbs * item.servingSize) || 0;
      totals.fats += (item.fats * item.servingSize) || 0;
      return totals;
    }, { calories: 0, proteins: 0, carbs: 0, fats: 0 });
  };

  const analyzeMeal = async () => {
    if (!mealDescription.trim()) {
      setError('Please enter a meal description');
      return;
    }
    
    setIsAnalyzingMeal(true);
    setError('');
    
    try {
      const analysisResult = await openAIService.analyzeMealNutrition(mealDescription);
      
      if (analysisResult && analysisResult.foods) {
        // Convert the analyzed foods to our food item format
        const analyzedFoodItems = analysisResult.foods.map((food, index) => ({
          id: `ai-analyzed-${index}`,
          name: food.name,
          brand: 'AI Analysis',
          calories: food.calories,
          proteins: food.proteins,
          carbs: food.carbs,
          fats: food.fats,
          servingUnit: 'serving',
          servingSize: 1,
          healthTip: analysisResult.healthTip
        }));
        
        // Add the analyzed items to selected items
        setSelectedFoodItems(prev => [...prev, ...analyzedFoodItems]);
        
        // Show the health tip if available
        if (analysisResult.healthTip) {
          setSuccess(analysisResult.healthTip);
          setTimeout(() => setSuccess(''), 5000);
        }
        
        // Clear the meal description
        setMealDescription('');
        
        // Toggle back to regular mode
        setAiMealAnalysis(false);
      }
    } catch (error) {
      console.error('Error analyzing meal:', error);
      setError('Failed to analyze meal. Please try again or add foods manually.');
    } finally {
      setIsAnalyzingMeal(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFoodItems.length === 0) {
      setError('Please add at least one food item');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      const totals = calculateTotals();
      
      const foodLogData = {
        ...formData,
        foods: selectedFoodItems.map(item => ({
          foodItem: item.id,
          foodName: item.name,
          brand: item.brand,
          servingSize: item.servingSize,
          servingUnit: item.servingUnit,
          calories: item.calories * item.servingSize,
          proteins: item.proteins * item.servingSize,
          carbs: item.carbs * item.servingSize,
          fats: item.fats * item.servingSize
        })),
        totalCalories: totals.calories,
        totalProteins: totals.proteins,
        totalCarbs: totals.carbs,
        totalFats: totals.fats
      };
      
      // For demo purposes, we'll just simulate a successful submission
      setTimeout(() => {
        setSuccess('Food log saved successfully!');
        setSelectedFoodItems([]);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          mealType: 'breakfast',
          notes: '',
          waterIntake: 0
        });
        setIsSubmitting(false);
        
        // Redirect after a delay
        setTimeout(() => {
          navigate('/patient-dashboard');
        }, 1500);
      }, 1000);

      /* In a real application, uncomment this code to make actual API calls
      const response = await authFetch('/api/food/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(foodLogData),
      });

      if (response.ok) {
        setSuccess('Food log saved successfully!');
        setSelectedFoodItems([]);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          mealType: 'breakfast',
          notes: '',
          waterIntake: 0
        });
        
        // Redirect after a delay
        setTimeout(() => {
          navigate('/patient-dashboard');
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to save food log');
      }
      */
    } catch (error) {
      console.error('Error saving food log:', error);
      setError('Error saving food log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-food-log-page">
      <div className="back-button-container">
        <button className="back-button" onClick={() => navigate('/patient-dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
      
      <div className="food-log-container">
        <div className="food-log-header">
          <h1>Add Food Log</h1>
          <div className="ai-toggle-buttons">
            <button 
              className={`toggle-button ${!aiMealAnalysis ? 'active' : ''}`} 
              onClick={() => setAiMealAnalysis(false)}
            >
              Search Foods
            </button>
            <button 
              className={`toggle-button ${aiMealAnalysis ? 'active' : ''}`} 
              onClick={() => setAiMealAnalysis(true)}
            >
              AI Meal Analysis
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} className="food-log-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input 
                type="date" 
                id="date" 
                name="date" 
                value={formData.date} 
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="mealType">Meal Type</label>
              <select 
                id="mealType" 
                name="mealType" 
                value={formData.mealType} 
                onChange={handleInputChange}
                required
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>
          
          <div className="form-group water-intake">
            <label htmlFor="waterIntake">Water Intake (ml)</label>
            <input 
              type="number" 
              id="waterIntake" 
              name="waterIntake" 
              min="0" 
              step="50"
              value={formData.waterIntake} 
              onChange={handleInputChange}
            />
          </div>
          
          {!aiMealAnalysis ? (
            <div className="food-search-section">
              <h3>Add Food Items</h3>
              <div className="search-container">
                <input 
                  type="text" 
                  placeholder="Search for food items (e.g., 'apple', 'chicken breast')..." 
                  value={searchTerm} 
                  onChange={handleSearchChange}
                  className="food-search-input"
                />
                {isSearching && <div className="search-spinner"></div>}
              </div>
              
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(item => (
                    <div key={item.id} className="food-item-result" onClick={() => addFoodItem(item)}>
                      <div className="food-item-name">
                        <strong>{item.name}</strong>
                        <span className="food-item-brand">{item.brand}</span>
                      </div>
                      <div className="food-item-nutrition">
                        <span className="food-calories">{item.calories} kcal</span>
                        <span className="food-serving">{item.servingUnit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchTerm && searchResults.length === 0 && !isSearching && (
                <div className="no-results">No food items found. Try a different search term.</div>
              )}
            </div>
          ) : (
            <div className="ai-meal-analysis-section">
              <h3>Analyze Entire Meal with AI</h3>
              <div className="meal-description-container">
                <textarea
                  className="meal-description-input"
                  placeholder="Describe your entire meal (e.g., 'I had 1 cup of brown rice, a grilled chicken breast, and steamed broccoli')..."
                  value={mealDescription}
                  onChange={handleMealDescriptionChange}
                  rows={4}
                ></textarea>
                <button 
                  type="button" 
                  className="analyze-meal-button"
                  onClick={analyzeMeal}
                  disabled={isAnalyzingMeal || !mealDescription.trim()}
                >
                  {isAnalyzingMeal ? 'Analyzing...' : 'Analyze Meal'}
                </button>
              </div>
            </div>
          )}
          
          {selectedFoodItems.length > 0 && (
            <div className="selected-foods-section">
              <h3>Selected Food Items</h3>
              <div className="selected-foods-list">
                {selectedFoodItems.map((item, index) => (
                  <div key={index} className="selected-food-item">
                    <div className="food-item-info">
                      <span className="food-name">{item.name}</span>
                      {item.healthTip && (
                        <span className="health-tip-icon" title={item.healthTip}>💡</span>
                      )}
                      <div className="serving-control">
                        <label>Servings:</label>
                        <input 
                          type="number" 
                          min="0.25" 
                          step="0.25" 
                          value={item.servingSize} 
                          onChange={(e) => updateServingSize(index, parseFloat(e.target.value))}
                        />
                        <span className="serving-unit">{item.servingUnit}</span>
                      </div>
                    </div>
                    <div className="food-nutrition">
                      <span className="nutrition-value">{Math.round(item.calories * item.servingSize)} kcal</span>
                      <span className="nutrition-value">{(item.proteins * item.servingSize).toFixed(1)}g protein</span>
                      <span className="nutrition-value">{(item.carbs * item.servingSize).toFixed(1)}g carbs</span>
                      <span className="nutrition-value">{(item.fats * item.servingSize).toFixed(1)}g fat</span>
                    </div>
                    <button 
                      type="button" 
                      className="remove-food-btn" 
                      onClick={() => removeFoodItem(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="nutrition-totals">
                <h4>Meal Totals:</h4>
                <div className="totals-values">
                  {(() => {
                    const totals = calculateTotals();
                    return (
                      <>
                        <div className="total-item">
                          <span className="total-label">Calories:</span>
                          <span className="total-value">{Math.round(totals.calories)} kcal</span>
                        </div>
                        <div className="total-item">
                          <span className="total-label">Protein:</span>
                          <span className="total-value">{totals.proteins.toFixed(1)}g</span>
                        </div>
                        <div className="total-item">
                          <span className="total-label">Carbs:</span>
                          <span className="total-value">{totals.carbs.toFixed(1)}g</span>
                        </div>
                        <div className="total-item">
                          <span className="total-label">Fat:</span>
                          <span className="total-value">{totals.fats.toFixed(1)}g</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea 
              id="notes" 
              name="notes" 
              value={formData.notes} 
              onChange={handleInputChange}
              placeholder="Add any notes about this meal..."
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={() => navigate('/patient-dashboard')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button" 
              disabled={isSubmitting || selectedFoodItems.length === 0}
            >
              {isSubmitting ? 'Saving...' : 'Save Food Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFoodLog; 