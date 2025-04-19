import { useAuth } from '../context/AuthContext';

const OPENAI_SYSTEM_PROMPT = `
You are a nutrition assistant helping users track their food intake and calculate nutritional information.
Your task is to:
1. Identify food items from user descriptions
2. Calculate nutritional values (calories, protein, carbs, fat)
3. Provide portion sizes and serving information
4. Offer tips for healthier alternatives when relevant

Respond with structured data in JSON format. Include the following fields:
- foodName: The standardized name of the food
- brand: Brand name if provided, or "Generic" if not
- servingSize: Standard serving size
- servingUnit: Unit of measurement (e.g., cup, tablespoon, gram)
- calories: Calories per serving
- proteins: Protein in grams per serving
- carbs: Carbohydrates in grams per serving
- fats: Fat in grams per serving
- healthTip: A brief health tip related to this food (optional)
`;

class OpenAIService {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.REACT_APP_OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
    this.model = 'gpt-4';
  }

  async getFoodNutritionData(foodDescription) {
    // For demo purposes, we'll simulate the API call instead of actually making it
    if (process.env.NODE_ENV === 'development' || !this.apiKey) {
      return this.simulateFoodDataResponse(foodDescription);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: OPENAI_SYSTEM_PROMPT },
            { role: 'user', content: `Please provide nutritional information for: ${foodDescription}` }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return JSON.parse(content);
    } catch (error) {
      console.error('Error fetching data from OpenAI:', error);
      // Fall back to simulated response in case of error
      return this.simulateFoodDataResponse(foodDescription);
    }
  }

  async analyzeMealNutrition(mealDescription) {
    // For demo purposes, we'll simulate the API call
    if (process.env.NODE_ENV === 'development' || !this.apiKey) {
      return this.simulateMealAnalysisResponse(mealDescription);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: OPENAI_SYSTEM_PROMPT },
            { role: 'user', content: `Please analyze this meal and provide nutritional breakdown: ${mealDescription}` }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.status}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing meal with OpenAI:', error);
      return this.simulateMealAnalysisResponse(mealDescription);
    }
  }

  // Simulate API response for development/demo purposes
  simulateFoodDataResponse(foodDescription) {
    // Basic pattern matching to return reasonable mock data
    const lowerCaseDesc = foodDescription.toLowerCase();

    // Apple pattern
    if (lowerCaseDesc.includes('apple')) {
      return {
        foodName: 'Apple',
        brand: 'Fresh Produce',
        servingSize: 1,
        servingUnit: 'medium (182g)',
        calories: 95,
        proteins: 0.5,
        carbs: 25,
        fats: 0.3,
        healthTip: 'Apples are high in fiber and vitamin C. The skin contains many of the nutrients, so eat it if possible.'
      };
    }
    
    // Chicken breast pattern
    else if (lowerCaseDesc.includes('chicken breast') || lowerCaseDesc.includes('chicken') && lowerCaseDesc.includes('breast')) {
      return {
        foodName: 'Chicken Breast',
        brand: 'Generic',
        servingSize: 100,
        servingUnit: 'g',
        calories: 165,
        proteins: 31,
        carbs: 0,
        fats: 3.6,
        healthTip: 'Chicken breast is an excellent lean protein source. Try baking or grilling instead of frying for a healthier meal.'
      };
    }
    
    // Rice pattern
    else if (lowerCaseDesc.includes('rice')) {
      if (lowerCaseDesc.includes('brown')) {
        return {
          foodName: 'Brown Rice',
          brand: 'Generic',
          servingSize: 1,
          servingUnit: 'cup (cooked)',
          calories: 216,
          proteins: 5,
          carbs: 45,
          fats: 1.8,
          healthTip: 'Brown rice has more fiber and nutrients than white rice due to the intact bran layer.'
        };
      } else {
        return {
          foodName: 'White Rice',
          brand: 'Generic',
          servingSize: 1,
          servingUnit: 'cup (cooked)',
          calories: 204,
          proteins: 4.2,
          carbs: 44.5,
          fats: 0.4,
          healthTip: 'White rice is a good energy source, but has less fiber and nutrients than brown rice.'
        };
      }
    }

    // Default response for unknown foods
    return {
      foodName: foodDescription,
      brand: 'Generic',
      servingSize: 1,
      servingUnit: 'serving',
      calories: Math.floor(Math.random() * 300) + 100,
      proteins: Math.floor(Math.random() * 20) + 2,
      carbs: Math.floor(Math.random() * 30) + 5,
      fats: Math.floor(Math.random() * 15) + 1,
      healthTip: 'Try to include a variety of food groups in your meals for balanced nutrition.'
    };
  }

  simulateMealAnalysisResponse(mealDescription) {
    // This would be more sophisticated in a real implementation
    const lowerCaseDesc = mealDescription.toLowerCase();
    let totalCalories = 0;
    let totalProteins = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    
    const foods = [];
    
    // Check for common foods in the description
    if (lowerCaseDesc.includes('chicken')) {
      foods.push({
        name: 'Chicken',
        calories: 165,
        proteins: 31,
        carbs: 0,
        fats: 3.6
      });
      totalCalories += 165;
      totalProteins += 31;
      totalFats += 3.6;
    }
    
    if (lowerCaseDesc.includes('rice')) {
      foods.push({
        name: 'Rice',
        calories: 204,
        proteins: 4.2,
        carbs: 44.5,
        fats: 0.4
      });
      totalCalories += 204;
      totalProteins += 4.2;
      totalCarbs += 44.5;
      totalFats += 0.4;
    }
    
    if (lowerCaseDesc.includes('broccoli') || lowerCaseDesc.includes('vegetable')) {
      foods.push({
        name: 'Vegetables',
        calories: 55,
        proteins: 3.7,
        carbs: 11.2,
        fats: 0.6
      });
      totalCalories += 55;
      totalProteins += 3.7;
      totalCarbs += 11.2;
      totalFats += 0.6;
    }
    
    // If no specific foods were found, generate some random data
    if (foods.length === 0) {
      totalCalories = Math.floor(Math.random() * 600) + 200;
      totalProteins = Math.floor(Math.random() * 30) + 10;
      totalCarbs = Math.floor(Math.random() * 60) + 20;
      totalFats = Math.floor(Math.random() * 25) + 5;
    }
    
    return {
      mealSummary: {
        totalCalories,
        totalProteins,
        totalCarbs,
        totalFats
      },
      foods,
      healthTip: "Try to include a variety of colors on your plate for a good mix of nutrients."
    };
  }
}

// Create a singleton instance
const openAIService = new OpenAIService();

export default openAIService; 