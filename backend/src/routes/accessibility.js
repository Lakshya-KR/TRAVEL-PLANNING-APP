const express = require('express');
const router = express.Router();
const axios = require('axios');
const { GOOGLE_MAPS_API_KEY } = require('../config');
const Accessibility = require('../models/Accessibility');

// Get detailed accessibility information for a destination
router.get('/:location', async (req, res) => {
  try {
    const location = req.params.location;
    
    // Try to get data from the database first
    let accessibilityData = await Accessibility.findOne({ 
      destinationName: { $regex: new RegExp(location, 'i') }
    });
    
    // If data exists and is not stale, return it
    if (accessibilityData && !accessibilityData.isStale()) {
      return res.json(accessibilityData);
    }
    
    // If no data exists or it's stale, generate new data
    
    // This would normally call a real accessibility database or API
    // For demo purposes, we'll generate structured data based on the location name
    
    // Placeholder data generation - in a real app, this would come from a database
    // Different cities have different accessibility scores to demonstrate the UI
    let hasWheelchair = true;
    let hasAccessibleTransport = true;
    let hasAccessibleAccommodations = false;
    let hasAssistiveServices = false;
    let hasSensoryAccommodations = false;
    
    const locationLower = location.toLowerCase();
    
    // Generate varying accessibility data based on location
    if (locationLower.includes('london') || locationLower.includes('paris') || locationLower.includes('new york')) {
      hasWheelchair = true;
      hasAccessibleTransport = true;
      hasAccessibleAccommodations = true;
      hasAssistiveServices = true;
      hasSensoryAccommodations = true;
    } else if (locationLower.includes('tokyo') || locationLower.includes('sydney') || locationLower.includes('berlin')) {
      hasWheelchair = true;
      hasAccessibleTransport = true;
      hasAccessibleAccommodations = true;
      hasAssistiveServices = false;
      hasSensoryAccommodations = true;
    } else if (locationLower.includes('bangkok') || locationLower.includes('cairo') || locationLower.includes('delhi')) {
      hasWheelchair = false;
      hasAccessibleTransport = false;
      hasAccessibleAccommodations = false;
      hasAssistiveServices = false;
      hasSensoryAccommodations = false;
    }
    
    // Create detailed accessibility features
    const detailedFeatures = [
      {
        name: "Wheelchair Accessibility",
        description: hasWheelchair 
          ? `${location} has good wheelchair accessibility in major tourist areas and attractions.` 
          : `${location} has limited wheelchair accessibility. Many streets and attractions may be difficult to navigate.`,
        category: "mobility",
        location: "Throughout the city"
      },
      {
        name: "Public Transportation",
        description: hasAccessibleTransport 
          ? `Public transportation in ${location} is largely wheelchair accessible with ramps and designated spaces.` 
          : `Public transportation in ${location} has limited accessibility features.`,
        category: "mobility",
        location: "Transportation hubs"
      },
      {
        name: "Audio Guides",
        description: `Many major attractions in ${location} offer audio guides for visually impaired visitors.`,
        category: "visual",
        location: "Major attractions and museums"
      },
      {
        name: "Sign Language Services",
        description: hasSensoryAccommodations 
          ? `Several major venues in ${location} offer sign language interpretation with advance notice.` 
          : `Limited sign language services are available in ${location}.`,
        category: "hearing",
        location: "Select venues only",
        hours: "By appointment"
      },
      {
        name: "Quiet Spaces",
        description: hasSensoryAccommodations 
          ? `Some museums and attractions in ${location} offer quiet spaces or sensory-friendly hours.` 
          : `Few dedicated quiet spaces are available in public areas.`,
        category: "sensory",
        location: "Select museums and attractions",
        hours: "Varies by venue"
      },
      {
        name: "Simplified Navigation",
        description: `Tourist information centers provide simplified maps and guides for visitors with cognitive impairments.`,
        category: "cognitive",
        location: "Tourist information centers",
        hours: "Standard opening hours"
      }
    ];
    
    // Generate specialized transport options
    const specializedTransport = hasAccessibleTransport 
      ? [
          {
            name: "Accessible Taxi Service",
            description: "Wheelchair accessible taxis available by phone booking",
            contact: "+1-555-ACCESS-CAB"
          },
          {
            name: "Adapted Vehicle Rental",
            description: "Vehicles with hand controls and wheelchair lifts",
            contact: "www.adaptedrentals.example.com"
          }
        ]
      : [];
    
    // Generate medical facilities
    const medicalFacilities = [
      {
        name: `${location} General Hospital`,
        description: "Full-service hospital with 24/7 emergency care",
        address: "123 Healthcare Ave, Central District",
        phone: "+1-555-HOSPITAL",
        website: "www.centralhospital.example.com",
        accessibilityFeatures: "Wheelchair accessible, interpreter services available"
      },
      {
        name: "Medical Assistance Center",
        description: "Tourist-focused clinic with multilingual staff",
        address: "45 Tourist Boulevard, Downtown",
        phone: "+1-555-MED-HELP",
        website: "www.touristmedical.example.com",
        accessibilityFeatures: "Wheelchair accessible"
      }
    ];
    
    const transportOptions = hasAccessibleTransport
      ? [
          "Buses with wheelchair ramps and designated spaces",
          "Metro/subway stations with elevators",
          "Accessible taxis can be requested via phone or app"
        ]
      : ["Limited accessible transportation options"];
    
    // Construct the new data object
    const newAccessibilityData = {
      destinationName: location,
      wheelchair: hasWheelchair,
      accessibleTransport: hasAccessibleTransport,
      accessibleAccommodations: hasAccessibleAccommodations,
      assistiveServices: hasAssistiveServices,
      sensoryAccommodations: hasSensoryAccommodations,
      notes: `General accessibility information for ${location}. Always call venues directly to confirm specific accessibility accommodations.`,
      detailedFeatures: detailedFeatures,
      transportNotes: hasAccessibleTransport 
        ? `${location} has a generally accessible public transportation system, but not all stations or stops may be fully accessible.` 
        : `${location} has limited accessible public transportation. Visitors with mobility impairments are advised to arrange private transportation.`,
      transportOptions: transportOptions,
      specializedTransport: specializedTransport,
      emergencyNumber: "911",
      medicalEmergencyNumber: "911",
      medicalFacilities: medicalFacilities,
      lastUpdated: new Date()
    };
    
    // Save to database (upsert if it exists already)
    if (accessibilityData) {
      await Accessibility.findByIdAndUpdate(accessibilityData._id, newAccessibilityData);
    } else {
      await Accessibility.create(newAccessibilityData);
    }
    
    res.json(newAccessibilityData);
  } catch (error) {
    console.error('Error fetching accessibility data:', error);
    res.status(500).json({ error: 'Failed to retrieve accessibility data.' });
  }
});

// Find accessible routes between two points
router.get('/accessible-routes', async (req, res) => {
  try {
    const { origin, destination, city, wheelchair } = req.query;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required.' });
    }
    
    // In a real app, this would call the Google Directions API with accessibility parameters
    // For demo purposes, we'll return mock data
    
    const mockRoute = {
      distance: { text: "3.2 km", value: 3200 },
      duration: { text: "45 mins", value: 2700 },
      accessibility_score: wheelchair ? 85 : 60,
      steps: [
        {
          travel_mode: "WALKING",
          distance: { text: "0.3 km", value: 300 },
          duration: { text: "5 mins", value: 300 },
          instructions: "Walk to bus stop",
          accessibility_notes: "Sidewalks with curb cuts available"
        },
        {
          travel_mode: "TRANSIT",
          distance: { text: "2.5 km", value: 2500 },
          duration: { text: "30 mins", value: 1800 },
          instructions: "Take Bus 42 - Accessible service",
          accessibility_notes: "Low-floor bus with wheelchair ramp"
        },
        {
          travel_mode: "WALKING",
          distance: { text: "0.4 km", value: 400 },
          duration: { text: "10 mins", value: 600 },
          instructions: "Walk to destination",
          accessibility_notes: "Some cobblestone streets in this area"
        }
      ],
      overview_polyline: {
        points: "a~l~Fjk~uOnzh@vlbBtc~@rgbB" // This would be a real polyline in production
      },
      accessible_features: {
        step_free: true,
        has_tactile_paving: true,
        has_accessible_transit: true,
        surface_quality: "Good",
        slope_concerns: false
      },
      warnings: wheelchair ? [] : ["Route includes some uneven surfaces"]
    };
    
    res.json({ routes: [mockRoute] });
  } catch (error) {
    console.error('Error finding accessible route:', error);
    res.status(500).json({ error: 'Failed to find accessible route.' });
  }
});

// Generate accessible itinerary
router.post('/generate-accessible-itinerary', async (req, res) => {
  try {
    const { destination, days, accessibilityNeeds } = req.body;
    
    if (!destination || !days) {
      return res.status(400).json({ error: 'Destination and number of days are required.' });
    }
    
    // In a real app, this would call an AI service to generate the custom itinerary
    // For demo purposes, we'll return mock data
    
    // Create accessibility-specific tips based on needs
    const accessibilityTips = [];
    
    if (accessibilityNeeds.includes('mobilityImpaired')) {
      accessibilityTips.push(
        "Book accommodations close to accessible public transportation.",
        "Call attractions in advance to confirm wheelchair accessibility.",
        "Consider renting mobility equipment for the duration of your stay."
      );
    }
    
    if (accessibilityNeeds.includes('visuallyImpaired')) {
      accessibilityTips.push(
        "Many museums offer tactile exhibits and audio descriptions.",
        "Service animals are welcome at most attractions.",
        "Consider booking guided tours specifically designed for visually impaired visitors."
      );
    }
    
    if (accessibilityNeeds.includes('hearingImpaired')) {
      accessibilityTips.push(
        "Request sign language interpreters or captioning services in advance.",
        "Many theaters and venues offer assistive listening devices.",
        "Visual alert systems are available at accessible accommodations."
      );
    }
    
    // Generate mock itinerary days
    const itineraryDays = [];
    
    for (let i = 1; i <= days; i++) {
      const dayActivities = [
        {
          time: "9:00 AM",
          activity: `Visit ${destination} Museum`,
          description: "Fully wheelchair accessible with tactile exhibits and audio guides.",
          accessibilityNotes: "Elevator access to all floors. Accessible restrooms available.",
          image: "museum.jpg"
        },
        {
          time: "12:30 PM",
          activity: "Lunch at Accessible Café",
          description: "Restaurant with step-free entrance and accessible menus.",
          accessibilityNotes: "Braille menus available. Staff trained in accessibility assistance.",
          image: "cafe.jpg"
        },
        {
          time: "2:00 PM",
          activity: `Explore ${destination} Park`,
          description: "Paved pathways throughout with accessible viewpoints.",
          accessibilityNotes: "Accessible restrooms and rest areas every 500 meters.",
          image: "park.jpg"
        },
        {
          time: "6:00 PM",
          activity: "Dinner at Inclusive Restaurant",
          description: "Award-winning restaurant with full accessibility features.",
          accessibilityNotes: "Sensory-friendly dining area available upon request.",
          image: "restaurant.jpg"
        }
      ];
      
      itineraryDays.push({
        day: i,
        title: `Day ${i}: Accessible Exploration of ${destination}`,
        activities: dayActivities
      });
    }
    
    const mockResponse = {
      itinerary: {
        days: itineraryDays,
        generalTips: [
          "Always call ahead to confirm specific accessibility accommodations.",
          "Consider purchasing a city accessibility pass for discounted access to attractions.",
          "Download the city's accessibility app for real-time information on elevator outages."
        ]
      },
      visitorInfo: {
        weather: {
          bestSeason: "Spring and Fall",
          seasonDetails: "Mild temperatures and fewer crowds make it ideal for accessible travel."
        }
      },
      accessibilityFeatures: {
        tips: accessibilityTips,
        emergencyContacts: [
          {
            name: "Accessibility Assistance Hotline",
            phone: "+1-555-ACCESS-HELP",
            description: "24/7 assistance for travelers with disabilities"
          }
        ]
      }
    };
    
    res.json(mockResponse);
  } catch (error) {
    console.error('Error generating accessible itinerary:', error);
    res.status(500).json({ error: 'Failed to generate accessible itinerary.' });
  }
});

module.exports = router; 