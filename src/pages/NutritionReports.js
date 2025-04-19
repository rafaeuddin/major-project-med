import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/NutritionReports.css';

const NutritionReports = () => {
  const { currentUser, authFetch } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [nutritionData, setNutritionData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Redirect if not logged in or not a patient
    if (!currentUser) {
      return;
    }
    
    if (currentUser.role !== 'patient') {
      navigate('/');
    } else {
      fetchNutritionData();
    }
  }, [currentUser, navigate]);

  const fetchNutritionData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // For demo purposes, we'll just simulate an API call with a delay and mock data
      setTimeout(() => {
        const mockNutritionData = {
          dailySummaries: Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Generate some random data with a weekend pattern
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const baseCalories = isWeekend ? 2200 : 1800;
            const variance = Math.random() * 400 - 200; // -200 to +200
            
            return {
              date: date.toISOString().split('T')[0],
              totalCalories: Math.round(baseCalories + variance),
              totalProteins: Math.round((baseCalories + variance) * 0.2 / 4), // 20% of calories from protein
              totalCarbs: Math.round((baseCalories + variance) * 0.5 / 4), // 50% of calories from carbs
              totalFats: Math.round((baseCalories + variance) * 0.3 / 9), // 30% of calories from fat
              waterIntake: Math.round(1500 + Math.random() * 1000), // 1500-2500ml
              meals: {
                breakfast: {
                  calories: Math.round((baseCalories + variance) * 0.25),
                  proteins: Math.round((baseCalories + variance) * 0.25 * 0.2 / 4),
                  carbs: Math.round((baseCalories + variance) * 0.25 * 0.5 / 4),
                  fats: Math.round((baseCalories + variance) * 0.25 * 0.3 / 9)
                },
                lunch: {
                  calories: Math.round((baseCalories + variance) * 0.35),
                  proteins: Math.round((baseCalories + variance) * 0.35 * 0.2 / 4),
                  carbs: Math.round((baseCalories + variance) * 0.35 * 0.5 / 4),
                  fats: Math.round((baseCalories + variance) * 0.35 * 0.3 / 9)
                },
                dinner: {
                  calories: Math.round((baseCalories + variance) * 0.3),
                  proteins: Math.round((baseCalories + variance) * 0.3 * 0.2 / 4),
                  carbs: Math.round((baseCalories + variance) * 0.3 * 0.5 / 4),
                  fats: Math.round((baseCalories + variance) * 0.3 * 0.3 / 9)
                },
                snack: {
                  calories: Math.round((baseCalories + variance) * 0.1),
                  proteins: Math.round((baseCalories + variance) * 0.1 * 0.2 / 4),
                  carbs: Math.round((baseCalories + variance) * 0.1 * 0.5 / 4),
                  fats: Math.round((baseCalories + variance) * 0.1 * 0.3 / 9)
                }
              }
            };
          }).sort((a, b) => new Date(a.date) - new Date(b.date)),
          overallSummary: {
            totalDays: 30,
            avgCalories: 1950,
            avgProteins: 97.5,
            avgCarbs: 244,
            avgFats: 65,
            avgWaterIntake: 2000
          }
        };
        
        setNutritionData(mockNutritionData);
        setIsLoading(false);
      }, 1000);
      
      /* In a real application, uncomment this code to make actual API calls
      const { startDate, endDate } = dateRange;
      const response = await authFetch(`/api/food/nutrition/summary?startDate=${startDate}&endDate=${endDate}`);
      
      if (response.ok) {
        const data = await response.json();
        setNutritionData(data.data);
      } else {
        setError('Failed to load nutrition data');
      }
      */
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      setError('Error loading nutrition data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyDateRange = (e) => {
    e.preventDefault();
    fetchNutritionData();
  };

  return (
    <div className="nutrition-reports-page">
      <div className="back-button-container">
        <button className="back-button" onClick={() => navigate('/patient-dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
      
      <div className="reports-container">
        <div className="reports-header">
          <h1>Nutrition Reports</h1>
          <p>View detailed nutrition statistics and track your progress</p>
        </div>
        
        <div className="date-range-form">
          <h3>Select Date Range</h3>
          <form onSubmit={handleApplyDateRange} className="date-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date</label>
                <input 
                  type="date" 
                  id="startDate" 
                  name="startDate" 
                  value={dateRange.startDate} 
                  onChange={handleDateRangeChange}
                  max={dateRange.endDate}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <input 
                  type="date" 
                  id="endDate" 
                  name="endDate" 
                  value={dateRange.endDate} 
                  onChange={handleDateRangeChange}
                  min={dateRange.startDate}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-action">
                <button type="submit" className="apply-button">Apply</button>
              </div>
            </div>
          </form>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {isLoading ? (
          <div className="loading-data">
            <div className="loading-spinner"></div>
            <p>Loading nutrition data...</p>
          </div>
        ) : nutritionData ? (
          <div className="reports-content">
            <div className="summary-section">
              <h2>Nutrition Summary</h2>
              <div className="summary-cards">
                <div className="summary-card">
                  <span className="card-title">Average Daily Calories</span>
                  <span className="card-value">{Math.round(nutritionData.overallSummary.avgCalories)} kcal</span>
                </div>
                <div className="summary-card">
                  <span className="card-title">Average Protein</span>
                  <span className="card-value">{Math.round(nutritionData.overallSummary.avgProteins)} g</span>
                </div>
                <div className="summary-card">
                  <span className="card-title">Average Carbs</span>
                  <span className="card-value">{Math.round(nutritionData.overallSummary.avgCarbs)} g</span>
                </div>
                <div className="summary-card">
                  <span className="card-title">Average Fats</span>
                  <span className="card-value">{Math.round(nutritionData.overallSummary.avgFats)} g</span>
                </div>
                <div className="summary-card">
                  <span className="card-title">Average Water</span>
                  <span className="card-value">{Math.round(nutritionData.overallSummary.avgWaterIntake)} ml</span>
                </div>
              </div>
            </div>
            
            <div className="daily-breakdown-section">
              <h2>Daily Breakdown</h2>
              
              <div className="daily-data-table">
                <div className="table-header">
                  <div className="table-cell date-cell">Date</div>
                  <div className="table-cell">Calories</div>
                  <div className="table-cell">Protein</div>
                  <div className="table-cell">Carbs</div>
                  <div className="table-cell">Fats</div>
                  <div className="table-cell">Water</div>
                </div>
                <div className="table-body">
                  {nutritionData.dailySummaries.map((day, index) => (
                    <div key={index} className="table-row">
                      <div className="table-cell date-cell">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="table-cell">{Math.round(day.totalCalories)} kcal</div>
                      <div className="table-cell">{Math.round(day.totalProteins)} g</div>
                      <div className="table-cell">{Math.round(day.totalCarbs)} g</div>
                      <div className="table-cell">{Math.round(day.totalFats)} g</div>
                      <div className="table-cell">{Math.round(day.waterIntake)} ml</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="meal-distribution-section">
              <h2>Meal Distribution</h2>
              <p className="section-description">
                This chart shows the average distribution of calories across different meals.
              </p>
              
              <div className="meal-chart">
                <div className="chart-placeholder">
                  <div className="chart-bar breakfast" style={{ height: '25%' }}>
                    <span className="bar-label">Breakfast</span>
                    <span className="bar-value">25%</span>
                  </div>
                  <div className="chart-bar lunch" style={{ height: '35%' }}>
                    <span className="bar-label">Lunch</span>
                    <span className="bar-value">35%</span>
                  </div>
                  <div className="chart-bar dinner" style={{ height: '30%' }}>
                    <span className="bar-label">Dinner</span>
                    <span className="bar-value">30%</span>
                  </div>
                  <div className="chart-bar snack" style={{ height: '10%' }}>
                    <span className="bar-label">Snacks</span>
                    <span className="bar-value">10%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="nutrition-insights">
              <h2>Insights & Recommendations</h2>
              <div className="insights-content">
                <div className="insight-card">
                  <h3>Calorie Intake</h3>
                  <p>Your average daily calorie intake is <strong>{Math.round(nutritionData.overallSummary.avgCalories)} kcal</strong>. Based on your profile, this is within a healthy range for your goals.</p>
                </div>
                <div className="insight-card">
                  <h3>Protein Consumption</h3>
                  <p>You're averaging <strong>{Math.round(nutritionData.overallSummary.avgProteins)}g</strong> of protein daily, which is adequate for muscle maintenance. Consider increasing to 100-120g for optimal muscle recovery.</p>
                </div>
                <div className="insight-card">
                  <h3>Hydration</h3>
                  <p>Your water intake averages <strong>{Math.round(nutritionData.overallSummary.avgWaterIntake)}ml</strong> daily. The recommended amount is 2000-2500ml. Try to increase your hydration throughout the day.</p>
                </div>
                <div className="insight-card">
                  <h3>Meal Timing</h3>
                  <p>Your calorie distribution across meals is well balanced. Keeping a consistent meal schedule can help with energy levels and metabolism.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-data-message">
            <p>No nutrition data available for the selected date range.</p>
            <p>Start tracking your diet by adding food logs.</p>
            <button 
              className="add-log-button"
              onClick={() => navigate('/add-food-log')}
            >
              Add Food Log
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionReports; 