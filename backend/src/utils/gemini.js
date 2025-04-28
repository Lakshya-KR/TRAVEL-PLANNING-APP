const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI);

console.log("API Key being used:", process.env.GEMINI);

async function generateItinerary(destination, days) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = `
You are a travel assistant.

Generate a detailed ${days}-day travel itinerary for a trip to ${destination}.
Each day should have:
- A short title (like "🌅 Beach & Chill")
- 3 to 4 fun activities (emojis included) such as sightseeing, food experiences, local culture, and adventure.

Format it strictly like this JSON:
[
  {
    "day": 1,
    "title": "🌅 Beach & Chill",
    "activities": ["🏖 Relax on Baga Beach", "🍤 Eat seafood at Fisherman's Wharf"]
  },
  ...
]
Only return the JSON, no explanations.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const itinerary = JSON.parse(text);
    return itinerary;
  } catch (err) {
    throw new Error("AI response couldn't be parsed. Try again.");``
  }
}

module.exports = generateItinerary;