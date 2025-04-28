const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
  throw new Error('Gemini API key is required');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Add rate limit monitoring
const checkRateLimit = (error) => {
  if (error.response) {
    const { status, headers } = error.response;
    if (status === 429) {
      console.log('\x1b[41m%s\x1b[0m', '⚠️ RATE LIMIT EXCEEDED for Gemini API!');
      console.log('\x1b[33m%s\x1b[0m', 'Rate Limit Details for Gemini API:');
      console.log('Status:', status);
      console.log('Headers:', headers);
      console.log('Error Message:', error.response?.data?.error?.message || 'Unknown error');
      return true;
    }
  }
  return false;
};

// Enhanced itinerary generation with Gemini AI
const generateItineraryContent = async (destination, days, destinationData) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `Create a detailed ${days}-day itinerary for ${destination}.
    
    Use this destination data for accurate recommendations:
    
    ATTRACTIONS: ${JSON.stringify(destinationData.attractions)}
    RESTAURANTS: ${JSON.stringify(destinationData.restaurants)}
    TRAVEL TIPS: ${JSON.stringify(destinationData.travelTips || [])}
    WEATHER: ${JSON.stringify(destinationData.weather || {})}
    
    For each day, provide:
    1. Morning activity (8am-12pm)
    2. Lunch recommendation (12pm-2pm)
    3. Afternoon activity (2pm-6pm)
    4. Evening activity and dinner (6pm-10pm) 
    
    Please include:
    - Specific attraction names from the provided list
    - Restaurant recommendations from the provided list
    - Timing for each activity
    - Brief descriptions of what visitors can expect
    - Tips for maximizing the experience
    
    Format your response as a valid JSON object with this exact structure:
    {
      "days": [
        {
          "day": 1,
          "activities": [
            {
              "time": "Morning (8:00 AM - 12:00 PM)",
              "activity": "Visit [Attraction Name]",
              "description": "Brief description",
              "tips": "Helpful tip"
            },
            {
              "time": "Lunch (12:00 PM - 2:00 PM)",
              "activity": "Eat at [Restaurant Name]",
              "description": "Brief description",
              "tips": "Helpful tip" 
            },
            {
              "time": "Afternoon (2:00 PM - 6:00 PM)",
              "activity": "Explore [Attraction/Area]",
              "description": "Brief description",
              "tips": "Helpful tip"
            },
            {
              "time": "Evening (6:00 PM - 10:00 PM)",
              "activity": "Dinner at [Restaurant] and [Evening Activity]",
              "description": "Brief description",
              "tips": "Helpful tip"
            }
          ]
        }
        // Additional days follow the same structure
      ],
      "generalTips": [
        "General tip 1",
        "General tip 2",
        "General tip 3"
      ]
    }
    
    IMPORTANT: Return ONLY the JSON object, no additional text or formatting. Ensure the JSON is valid.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    try {
      // Parse and validate JSON response
      const itinerary = JSON.parse(content);
      
      if (!itinerary.days || !Array.isArray(itinerary.days)) {
        throw new Error('Itinerary must contain a days array');
      }
      
      // Validate and clean up the structure
      const formattedItinerary = {
        days: itinerary.days.map(day => ({
          day: day.day,
          activities: Array.isArray(day.activities) ? day.activities.map(activity => ({
            time: activity.time || '',
            activity: activity.activity || '',
            description: activity.description || '',
            tips: activity.tips || ''
          })) : []
        })),
        generalTips: Array.isArray(itinerary.generalTips) ? 
          itinerary.generalTips.filter(tip => typeof tip === 'string') : []
      };

      return formattedItinerary;
    } catch (parseError) {
      console.error('Error parsing itinerary JSON:', parseError);
      console.error('Raw content that failed to parse:', content);
      
      // Return a default itinerary structure
      return {
        days: Array.from({ length: days }, (_, i) => ({
          day: i + 1,
          activities: [
            {
              time: "Morning (8:00 AM - 12:00 PM)",
              activity: `Explore ${destination}`,
              description: "Start your day exploring the destination's highlights.",
              tips: "Begin early to avoid crowds."
            },
            {
              time: "Lunch (12:00 PM - 2:00 PM)",
              activity: "Local cuisine experience",
              description: "Try the local specialties at a popular restaurant.",
              tips: "Ask locals for recommendations."
            },
            {
              time: "Afternoon (2:00 PM - 6:00 PM)",
              activity: "Visit main attractions",
              description: "Explore the main tourist sites and cultural spots.",
              tips: "Check opening hours ahead of time."
            },
            {
              time: "Evening (6:00 PM - 10:00 PM)",
              activity: "Dinner and evening activity",
              description: "Enjoy dinner followed by local entertainment.",
              tips: "Book popular restaurants in advance."
            }
          ]
        })),
        generalTips: [
          `Pack appropriately for ${destination}'s weather.`,
          "Respect local customs and traditions.",
          "Keep important documents secure while traveling."
        ]
      };
    }
  } catch (error) {
    if (checkRateLimit(error)) {
      console.log('\x1b[33m%s\x1b[0m', 'Gemini API Rate Limit Error for itinerary generation. Please try again in a few minutes.');
      throw new Error('Itinerary generation temporarily unavailable due to rate limiting. Please try again in a few minutes.');
    }
    console.error('Error generating itinerary content:', error);
    throw error;
  }
};

module.exports = {
  generateItineraryContent
}; 