const Destination = require('../models/Destination');
const { generateItineraryContent } = require('../services/geminiService');
const {
  searchPlace,
  getPlaceDetails,
  getPlacePhotos,
  getNearbyAttractions,
  getNearbyHotels,
  getNearbyRestaurants,
  getEnhancedPlaceDetails,
  getHighQualityPlacePhotos,
  getVisitorInformation
} = require('../services/googlePlacesService');
const axios = require('axios');

const searchDestinations = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 3) {
      return res.status(400).json({
        results: [],
        message: 'Please enter at least 3 characters'
      });
    }

    // Skip cache check and always fetch fresh data
    console.log('Fetching fresh search data for:', q);
    
    // Detect if the query is likely a city name
    const isCityQuery = q.split(' ').length <= 3 && !/\d/.test(q);
    
    // For city searches, try to get multiple results instead of just one
    if (isCityQuery) {
      try {
        console.log('Attempting to get multiple city results');
        const cityResponse = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/place/textsearch/json`, {
          params: {
            query: q,
            key: process.env.GOOGLE_PLACES_API_KEY,
            types: 'locality,administrative_area_level_1,administrative_area_level_2',
            language: 'en'
          }
        });
        
        if (cityResponse.data.status === 'OK' && cityResponse.data.results.length > 0) {
          // Process up to 5 city results
          const cityResults = await Promise.all(
            cityResponse.data.results.slice(0, 5).map(async (place) => {
              // Get a photo if available
              let photos = [];
              if (place.photos && place.photos.length > 0) {
                const photoRef = place.photos[0].photo_reference;
                const photoUrl = `${GOOGLE_MAPS_API_BASE_URL}/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
                photos = [{ url: photoUrl, thumbnail: photoUrl }];
              }
              
              return {
                name: place.name,
                place_id: place.place_id,
                place_type: 'city',
                location: place.geometry.location,
                formatted_address: place.formatted_address,
                types: place.types,
                photos
              };
            })
          );
          
          return res.json({
            results: cityResults,
            message: 'Multiple city results found'
          });
        }
      } catch (citySearchError) {
        console.error('Error in city search:', citySearchError.message);
        // Continue with normal search
      }
    }
    
    // Get fresh data from Google API
    const place = await searchPlace(q);
    
    if (!place) {
      return res.json({
        results: [],
        message: 'No locations found. Please try a different search term.'
      });
    }

    // Get fresh place details from Google APIs only
    const details = await getPlaceDetails(place.place_id);

    // Generate default content structure from Google data, not AI
    const content = {
      overview: details.description || `Explore ${place.name}, a popular destination for travelers.`,
      attractions: [],
      hotels: [],
      restaurants: [],
      travelTips: [
        "Research local customs before your trip",
        "Check the weather forecast before packing",
        "Keep important documents secure"
      ],
      bestTimeToVisit: "Year-round, with peak seasons varying",
      localCulture: `Experience the local culture and traditions of ${place.name}.`
    };

    // Get photos if available - ensure we have photo references for the search results
    const photos = details.photos ? await getPlacePhotos(details.photos.map(p => p.reference)) : [];

    // Prepare the result with necessary data for unique image display
    const searchResult = {
      name: place.name,
      type: 'location',
      place_id: place.place_id,
      place_type: place.place_type || 'destination',
      location: place.location,
      formatted_address: place.formatted_address,
      photos: photos.slice(0, 3), // Include up to 3 photos for variety
      details: {
        rating: details.rating,
        address: details.address,
        description: details.description || content.overview
      },
      content
    };

    // Save to cache for future reference, but return fresh data
    const destination = await Destination.findOneAndUpdate(
      { name: place.name },
      {
        name: place.name,
        content,
        photos,
        details,
        lastUpdated: Date.now()
      },
      { upsert: true, new: true }
    );

    res.json({
      results: [searchResult],
      message: 'Fresh location data retrieved'
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      results: [],
      message: 'An error occurred while searching. Please try again.',
      error: error.message
    });
  }
};

const getDestinationDetails = async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: 'Destination name is required' });
    }

    console.log(`Getting fresh details for destination: ${name}`);

    // Skip cache check and always fetch fresh data from Google API
    const place = await searchPlace(name);
    if (!place) {
      throw new Error('Location not found');
    }
    
    console.log(`Found place: ${place.name}, place_id: ${place.place_id}`);

    // Fetch all data in parallel with enhanced place details
    const [enhancedDetails, attractions, hotels, restaurants] = await Promise.all([
      getEnhancedPlaceDetails(place.place_id),
      getNearbyAttractions(place.location),
      getNearbyHotels(place.location),
      getNearbyRestaurants(place.location)
    ]);
    
    // Log the photo references we received
    console.log(`Enhanced details photos: ${enhancedDetails.photos ? enhancedDetails.photos.length : 0} photos found`);
    if (enhancedDetails.photos && enhancedDetails.photos.length > 0) {
      console.log(`First photo reference: ${enhancedDetails.photos[0].reference}`);
    } else {
      console.log('No photos found in enhanced details');
    }

    // Get high-quality photos for the main place and nearby places
    const photoPromises = [
      enhancedDetails.photos.length ? getHighQualityPlacePhotos(enhancedDetails.photos.map(p => p.reference)) : [],
      ...attractions.map(a => a.photos.length ? getHighQualityPlacePhotos([a.photos[0]]) : []),
      ...hotels.map(h => h.photos.length ? getHighQualityPlacePhotos([h.photos[0]]) : []),
      ...restaurants.map(r => r.photos.length ? getHighQualityPlacePhotos([r.photos[0]]) : [])
    ];

    const [mainPhotos, ...nearbyPhotos] = await Promise.all(photoPromises);
    
    // Log main photos for debugging
    console.log(`Main photos: ${mainPhotos.length} high-quality photos fetched`);
    if (mainPhotos.length > 0) {
      console.log(`First main photo URL: ${mainPhotos[0].medium}`);
    }

    // Get visitor information 
    const visitorInfo = await getVisitorInformation(place.place_id, place.location);

    // Generate content directly from the Google APIs data, not using Gemini
    const content = {
      overview: enhancedDetails.description || `Explore ${place.name}, a popular destination for travelers.`,
      attractions: attractions.slice(0, 6).map(attraction => ({
        name: attraction.name,
        description: `A popular attraction in ${place.name}.`,
        rating: attraction.rating || 4.0
      })),
      hotels: hotels.slice(0, 4).map(hotel => ({
        name: hotel.name,
        description: `A ${hotel.price_level ? Array(hotel.price_level).fill('$').join('') : '$$'} hotel in ${place.name}.`,
        priceRange: hotel.price_level === 1 ? 'Budget' : hotel.price_level === 2 ? 'Mid-range' : 'Luxury',
        rating: hotel.rating || 4.0
      })),
      restaurants: restaurants.slice(0, 4).map(restaurant => ({
        name: restaurant.name,
        description: `A popular dining option in ${place.name}.`,
        cuisine: restaurant.types ? restaurant.types.filter(t => t !== 'restaurant' && t !== 'establishment').map(t => t.replace('_', ' ')).join(', ') : 'Local cuisine',
        rating: restaurant.rating || 4.0
      })),
      travelTips: [
        "Research local customs before your trip",
        "Check the weather forecast before packing",
        "Keep important documents secure",
        "Try local cuisine for an authentic experience",
        "Learn a few basic phrases in the local language"
      ],
      bestTimeToVisit: "Year-round, with peak seasons varying",
      localCulture: `Experience the local culture and traditions of ${place.name}.`
    };

    const enrichedData = {
      ...enhancedDetails,
      photos: mainPhotos,
      nearby: {
        attractions: attractions.map((a, i) => ({
          ...a,
          photos: nearbyPhotos[i] || []
        })),
        hotels: hotels.map((h, i) => ({
          ...h,
          photos: nearbyPhotos[i + attractions.length] || []
        })),
        restaurants: restaurants.map((r, i) => ({
          ...r,
          photos: nearbyPhotos[i + attractions.length + hotels.length] || []
        }))
      }
    };

    // Update cache for future reference, but return fresh data
    const destination = await Destination.findOneAndUpdate(
      { name: place.name },
      {
        name: place.name,
        content,
        photos: mainPhotos,
        details: enrichedData,
        visitorInfo,
        lastUpdated: Date.now()
      },
      { upsert: true, new: true }
    );
    
    console.log(`Successfully updated destination data: ${place.name}`);

    res.json({
      name: place.name,
      content,
      photos: mainPhotos,
      details: enrichedData,
      visitorInfo
    });
  } catch (error) {
    console.error('Error in getDestinationDetails:', error);
    res.status(500).json({ error: 'Failed to fetch destination details', details: error.message });
  }
};

const generateItinerary = async (req, res) => {
  try {
    const { destination, days } = req.body;

    if (!destination || !days) {
      return res.status(400).json({ 
        error: 'Destination and number of days are required' 
      });
    }

    // Get place details first
    const place = await searchPlace(destination);
    if (!place) {
      throw new Error('Location not found');
    }

    // Get nearby attractions, restaurants, and visitor info for better itinerary generation
    const [attractions, restaurants, visitorInfo] = await Promise.all([
      getNearbyAttractions(place.location),
      getNearbyRestaurants(place.location),
      getVisitorInformation(place.place_id, place.location)
    ]);

    // Generate itinerary using the real place data and visitor information
    const itinerary = await generateItineraryContent(destination, days, {
      attractions: attractions.map(a => ({
        name: a.name,
        rating: a.rating,
        types: a.types || []
      })),
      restaurants: restaurants.map(r => ({
        name: r.name,
        rating: r.rating,
        price_level: r.price_level
      })),
      weather: visitorInfo.weather || {},
      travelTips: visitorInfo.localInfo?.safety?.safetyTips || []
    });

    res.json({
      destination: place.name,
      days,
      itinerary,
      location: place.location,
      visitorInfo: {
        weather: visitorInfo.weather,
        transportation: visitorInfo.transportation,
        bestTimes: visitorInfo.bestTimes
      }
    });
  } catch (error) {
    console.error('Error generating itinerary:', error);
    res.status(500).json({ 
      error: 'Failed to generate itinerary',
      details: error.message
    });
  }
};

module.exports = {
  searchDestinations,
  getDestinationDetails,
  generateItinerary
};