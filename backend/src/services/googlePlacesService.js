const axios = require('axios');
const { getFromCache, setInCache } = require('./cacheService');

if (!process.env.GOOGLE_PLACES_API_KEY) {
  console.error('GOOGLE_PLACES_API_KEY is not set in environment variables');
  throw new Error('Google Places API key is required');
}

const GOOGLE_MAPS_API_BASE_URL = 'https://maps.googleapis.com/maps/api';
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const searchPlace = async (query) => {
  try {
    console.log(`Searching for place: ${query}`);
    
    // Skip cache check and always fetch fresh data
    console.log('Fetching fresh data from Google API');
    
    // First check if the query looks like a city name - simpler queries are more likely to be cities/regions
    const isCityQuery = query.split(' ').length <= 3 && !/\d/.test(query); // Simple heuristic: few words, no numbers
    
    if (isCityQuery) {
      // Try searching for city/locality first
      console.log('Query appears to be a city/region name, searching for locality first');
      const cityResponse = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/place/textsearch/json`, {
        params: {
          query: query,
          key: API_KEY,
          types: 'locality,administrative_area_level_1,administrative_area_level_2',
          language: 'en'
        }
      });
      
      if (cityResponse.data.status === 'OK' && cityResponse.data.results.length > 0) {
        const place = cityResponse.data.results[0];
        console.log(`Found city: ${place.name}, place_id: ${place.place_id}`);
        
        const result = {
          name: place.name,
          location: place.geometry.location,
          place_id: place.place_id,
          rating: place.rating,
          formatted_address: place.formatted_address,
          types: place.types,
          place_type: 'city'
        };
        
        // Still cache the result for potential future use
        await setInCache('search_results', query, result);
        return result;
      }
    }
    
    // If not a city query or city search returned no results, search for tourist destinations
    console.log('Searching for tourist destination');
    const response = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/place/textsearch/json`, {
      params: {
        query: `${query} ${isCityQuery ? 'city' : 'tourist destination'}`,
        key: API_KEY,
        language: 'en'
      }
    });

    if (response.data.status !== 'OK' || response.data.results.length === 0) {
      // If no tourist destinations found, try a general search with no type filters
      console.log('No specific results found, trying general search');
      const generalResponse = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/place/textsearch/json`, {
        params: {
          query: query,
          key: API_KEY,
          language: 'en'
        }
      });
      
      if (generalResponse.data.status !== 'OK' || generalResponse.data.results.length === 0) {
        console.error('No results found for query:', query);
        return null;
      }
      
      const place = generalResponse.data.results[0];
      
      // Determine the type based on the returned place's types
      let placeType = 'location';
      if (place.types) {
        if (place.types.includes('locality') || 
            place.types.includes('administrative_area_level_1') || 
            place.types.includes('administrative_area_level_2')) {
          placeType = 'city';
        } else if (place.types.includes('tourist_attraction') || 
                  place.types.includes('point_of_interest')) {
          placeType = 'tourist_attraction';
        }
      }
      
      const result = {
        name: place.name,
        location: place.geometry.location,
        place_id: place.place_id,
        rating: place.rating,
        formatted_address: place.formatted_address,
        types: place.types,
        place_type: placeType
      };
      
      await setInCache('search_results', query, result);
      return result;
    }

    const place = response.data.results[0];
    if (!place) return null;

    // Determine the type based on the returned place's types
    let placeType = 'tourist_attraction';
    if (place.types) {
      if (place.types.includes('locality') || 
          place.types.includes('administrative_area_level_1') || 
          place.types.includes('administrative_area_level_2')) {
        placeType = 'city';
      }
    }

    const result = {
      name: place.name,
      location: place.geometry.location,
      place_id: place.place_id,
      rating: place.rating,
      formatted_address: place.formatted_address,
      types: place.types,
      place_type: placeType
    };

    // Update cache but return fresh data
    await setInCache('search_results', query, result);
    return result;
  } catch (error) {
    console.error('Error in searchPlace:', error.message);
    throw error;
  }
};

const getPlaceDetails = async (placeId) => {
  try {
    // Skip cache check and always fetch fresh data
    console.log('Fetching fresh place details from Google API');

    const response = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/place/details/json`, {
      params: {
        place_id: placeId,
        key: API_KEY,
        fields: 'name,rating,formatted_phone_number,formatted_address,opening_hours,website,price_level,review,photo,type,url'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Failed to get place details: ${response.data.status}`);
    }

    const details = response.data.result;
    
    // Process and structure the data
    const placeDetails = {
      name: details.name,
      address: details.formatted_address,
      phone: details.formatted_phone_number,
      rating: details.rating,
      website: details.website,
      url: details.url,
      priceLevel: details.price_level,
      photos: details.photos?.map(photo => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
        attribution: photo.html_attributions[0]
      })) || [],
      reviews: details.reviews?.map(review => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.time,
        authorUrl: review.author_url
      })) || [],
      openingHours: details.opening_hours?.weekday_text || []
    };

    // Still cache the result for potential future use
    await setInCache('place_details', placeId, placeDetails);
    return placeDetails;
  } catch (error) {
    console.error('Error in getPlaceDetails:', error.message);
    throw error;
  }
};

const getPlacePhotos = async (photoReferences, maxWidth = 800) => {
  try {
    // Skip cache check and always fetch fresh data
    console.log('Fetching fresh place photos from Google API');

    // Create direct photo URLs with API key
    const photoUrls = photoReferences.map(ref => ({
      url: `${GOOGLE_MAPS_API_BASE_URL}/place/photo?maxwidth=${maxWidth}&photo_reference=${ref}&key=${API_KEY}`,
      thumbnail: `${GOOGLE_MAPS_API_BASE_URL}/place/photo?maxwidth=400&photo_reference=${ref}&key=${API_KEY}`,
      reference: ref
    }));

    // Still cache the result for potential future use
    const cacheKey = photoReferences.join(',');
    await setInCache('photos', cacheKey, photoUrls);
    
    // Return at least one placeholder if no photos - use Google Maps Static API
    if (photoUrls.length === 0) {
      return [getDefaultPlaceImage()];
    }
    
    return photoUrls;
  } catch (error) {
    console.error('Error in getPlacePhotos:', error.message);
    // Return fallback Google Maps images if there's an error
    return [getDefaultPlaceImage()];
  }
};

// Get default image using Google Maps Static API
const getDefaultPlaceImage = (location = { lat: 48.8584, lng: 2.2945 }) => {
  // Use Google Maps Static API for default images
  return {
    url: `${GOOGLE_MAPS_API_BASE_URL}/staticmap?center=${location.lat},${location.lng}&zoom=13&size=800x600&maptype=roadmap&key=${API_KEY}`,
    thumbnail: `${GOOGLE_MAPS_API_BASE_URL}/staticmap?center=${location.lat},${location.lng}&zoom=13&size=400x300&maptype=roadmap&key=${API_KEY}`,
    reference: 'default_map_image'
  };
};

const getNearbyAttractions = async (location, radius = 5000) => {
  try {
    // Skip cache check and always fetch fresh data
    console.log('Fetching fresh nearby attractions from Google API');

    const response = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/place/nearbysearch/json`, {
      params: {
        location: `${location.lat},${location.lng}`,
        radius,
        type: 'tourist_attraction',
        key: API_KEY,
        language: 'en'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Failed to get nearby attractions: ${response.data.status}`);
    }

    const attractions = response.data.results.map(place => ({
      name: place.name,
      place_id: place.place_id,
      location: place.geometry.location,
      rating: place.rating,
      types: place.types,
      photos: place.photos?.map(photo => photo.photo_reference) || []
    }));

    // Still cache the result for potential future use
    const cacheKey = `${location.lat},${location.lng},${radius}`;
    await setInCache('nearby_places', cacheKey, attractions);
    return attractions;
  } catch (error) {
    console.error('Error in getNearbyAttractions:', error.message);
    return [];
  }
};

const getNearbyHotels = async (location, radius = 5000) => {
  try {
    // Skip cache check and always fetch fresh data
    console.log('Fetching fresh nearby hotels from Google API');
    
    const response = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/place/nearbysearch/json`, {
      params: {
        location: `${location.lat},${location.lng}`,
        radius,
        type: 'lodging',
        key: API_KEY,
        language: 'en'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Failed to get nearby hotels: ${response.data.status}`);
    }

    const hotels = response.data.results.map(place => ({
      name: place.name,
      place_id: place.place_id,
      location: place.geometry.location,
      rating: place.rating,
      price_level: place.price_level,
      photos: place.photos?.map(photo => photo.photo_reference) || []
    }));
    
    // Still cache the result for potential future use
    const cacheKey = `hotels_${location.lat},${location.lng},${radius}`;
    await setInCache('nearby_hotels', cacheKey, hotels);
    return hotels;
  } catch (error) {
    console.error('Error in getNearbyHotels:', error.message);
    return [];
  }
};

const getNearbyRestaurants = async (location, radius = 5000) => {
  try {
    // Skip cache check and always fetch fresh data
    console.log('Fetching fresh nearby restaurants from Google API');
    
    const response = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/place/nearbysearch/json`, {
      params: {
        location: `${location.lat},${location.lng}`,
        radius,
        type: 'restaurant',
        key: API_KEY,
        language: 'en'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Failed to get nearby restaurants: ${response.data.status}`);
    }

    const restaurants = response.data.results.map(place => ({
      name: place.name,
      place_id: place.place_id,
      location: place.geometry.location,
      rating: place.rating,
      price_level: place.price_level,
      photos: place.photos?.map(photo => photo.photo_reference) || []
    }));
    
    // Still cache the result for potential future use
    const cacheKey = `restaurants_${location.lat},${location.lng},${radius}`;
    await setInCache('nearby_restaurants', cacheKey, restaurants);
    return restaurants;
  } catch (error) {
    console.error('Error in getNearbyRestaurants:', error.message);
    return [];
  }
};

const getPlaceAutocomplete = async (query) => {
  try {
    const response = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/place/autocomplete/json`, {
      params: {
        input: query,
        types: '(cities)',
        key: API_KEY,
        language: 'en'
      }
    });

    if (response.data.status !== 'OK') {
      return [];
    }

    return response.data.predictions.map(prediction => ({
      place_id: prediction.place_id,
      description: prediction.description,
      main_text: prediction.structured_formatting.main_text,
      secondary_text: prediction.structured_formatting.secondary_text
    }));
  } catch (error) {
    console.error('Error in getPlaceAutocomplete:', error.message);
    return [];
  }
};

const getPlaceWeather = async (location) => {
  try {
    // Skip cache check and always fetch fresh data
    console.log('Fetching fresh weather data from Google API');

    const response = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/geocode/json`, {
      params: {
        latlng: `${location.lat},${location.lng}`,
        key: API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      return null;
    }

    const timezoneResponse = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/timezone/json`, {
      params: {
        location: `${location.lat},${location.lng}`,
        timestamp: Math.floor(Date.now() / 1000),
        key: API_KEY
      }
    });

    const weatherData = {
      timezone: timezoneResponse.data,
      address_components: response.data.results[0].address_components
    };

    // Still cache the result for potential future use
    const cacheKey = `${location.lat},${location.lng}`;
    await setInCache('weather', cacheKey, weatherData);
    return weatherData;
  } catch (error) {
    console.error('Error in getPlaceWeather:', error.message);
    return null;
  }
};

const getPopularTimes = async (placeId) => {
  try {
    // Skip cache check and always fetch fresh data
    console.log('Fetching fresh popular times data from Google API');

    const response = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/place/details/json`, {
      params: {
        place_id: placeId,
        key: API_KEY,
        fields: 'current_opening_hours,utc_offset,popular_times'
      }
    });

    if (response.data.status !== 'OK') {
      return null;
    }

    const popularTimes = {
      current_opening_hours: response.data.result.current_opening_hours,
      popular_times: response.data.result.popular_times
    };

    // Still cache the result for potential future use
    await setInCache('popular_times', placeId, popularTimes);
    return popularTimes;
  } catch (error) {
    console.error('Error in getPopularTimes:', error.message);
    return null;
  }
};

// Get full place details with all available fields
const getEnhancedPlaceDetails = async (placeId) => {
  try {
    // Skip cache and get fresh data directly from Google API
    console.log('Fetching fresh enhanced place details from Google API');

    const response = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/place/details/json`, {
      params: {
        place_id: placeId,
        key: API_KEY,
        // Request all available fields for maximum information
        fields: 'name,rating,formatted_phone_number,formatted_address,opening_hours,website,price_level,review,photo,type,url,address_component,adr_address,business_status,geometry,icon,international_phone_number,plus_code,rating,utc_offset,vicinity,permanently_closed,editorial_summary'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Failed to get enhanced place details: ${response.data.status}`);
    }

    const details = response.data.result;
    
    // Process and structure the data with added information
    const enhancedDetails = {
      name: details.name,
      address: details.formatted_address,
      phone: details.formatted_phone_number,
      internationalPhone: details.international_phone_number,
      rating: details.rating,
      website: details.website,
      url: details.url,
      priceLevel: details.price_level,
      businessStatus: details.business_status,
      vicinity: details.vicinity,
      utcOffset: details.utc_offset,
      plusCode: details.plus_code,
      icon: details.icon,
      // Include editorial summary if available (Google's description of the place)
      description: details.editorial_summary?.overview || '',
      // Detailed address components
      addressComponents: details.address_component?.map(component => ({
        longName: component.long_name,
        shortName: component.short_name,
        types: component.types
      })) || [],
      photos: details.photos?.map(photo => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
        attribution: photo.html_attributions[0]
      })) || [],
      reviews: details.reviews?.map(review => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.time,
        authorUrl: review.author_url
      })) || [],
      openingHours: details.opening_hours?.weekday_text || [],
      permanentlyClosed: details.permanently_closed || false,
      // Extract location coordinates
      location: details.geometry?.location || {}
    };

    // Still cache the result for potential future use
    await setInCache('enhanced_place_details', placeId, enhancedDetails);
    return enhancedDetails;
  } catch (error) {
    console.error('Error in getEnhancedPlaceDetails:', error.message);
    throw error;
  }
};

// Get high-quality images for a place with different sizes
const getHighQualityPlacePhotos = async (photoReferences) => {
  try {
    // If no photo references provided, return fallback images
    if (!photoReferences || photoReferences.length === 0) {
      console.log('No photo references provided, using fallback images');
      const defaultImage = getDefaultPlaceMap();
      return [defaultImage];
    }
    
    // Skip cache check and always fetch fresh data
    console.log('Fetching fresh high-quality photos from Google API');

    // Create direct photo URLs with API key
    const photoUrls = photoReferences.map(ref => ({
      large: `${GOOGLE_MAPS_API_BASE_URL}/place/photo?maxwidth=1200&photo_reference=${ref}&key=${API_KEY}`,
      medium: `${GOOGLE_MAPS_API_BASE_URL}/place/photo?maxwidth=800&photo_reference=${ref}&key=${API_KEY}`,
      thumbnail: `${GOOGLE_MAPS_API_BASE_URL}/place/photo?maxwidth=400&photo_reference=${ref}&key=${API_KEY}`,
      reference: ref
    }));

    // Still cache the result for potential future use
    const cacheKey = photoReferences.join(',') + '_hq';
    await setInCache('hq_photos', cacheKey, photoUrls);
    return photoUrls;
  } catch (error) {
    console.error('Error in getHighQualityPlacePhotos:', error.message);
    // Return fallback Google Maps images if there's an error
    return [getDefaultPlaceMap()];
  }
};

// Get default map using Google Maps Static API with satellite view for better visuals
const getDefaultPlaceMap = (location = { lat: 48.8584, lng: 2.2945 }) => {
  // Use Google Maps Static API for default images with satellite view
  return {
    large: `${GOOGLE_MAPS_API_BASE_URL}/staticmap?center=${location.lat},${location.lng}&zoom=14&size=1200x800&maptype=satellite&key=${API_KEY}`,
    medium: `${GOOGLE_MAPS_API_BASE_URL}/staticmap?center=${location.lat},${location.lng}&zoom=14&size=800x600&maptype=satellite&key=${API_KEY}`,
    thumbnail: `${GOOGLE_MAPS_API_BASE_URL}/staticmap?center=${location.lat},${location.lng}&zoom=14&size=400x300&maptype=satellite&key=${API_KEY}`,
    reference: 'default_satellite_map'
  };
};

// Get visitor information including local information and best times to visit
const getVisitorInformation = async (placeId, location) => {
  try {
    // Skip cache check and always fetch fresh data
    console.log('Fetching fresh visitor information from Google API');

    // Make parallel requests to get all needed visitor information
    const [weatherData, popularTimes, currencyData] = await Promise.all([
      getPlaceWeather(location),
      getPopularTimes(placeId),
      getLocationCurrencyInfo(placeId)
    ]);

    const visitorInfo = {
      weather: weatherData,
      bestTimes: popularTimes,
      localInfo: {
        currency: currencyData,
        timezone: await getTimezoneInfo(location),
        safety: await getSafetyInfo(placeId)
      },
      // Accessibility and practical information
      accessibility: await getAccessibilityInfo(placeId),
      transportation: await getTransportationInfo(location)
    };

    // Still cache the result for potential future use
    const cacheKey = `visitor_info_${placeId}`;
    await setInCache('visitor_info', cacheKey, visitorInfo);
    return visitorInfo;
  } catch (error) {
    console.error('Error in getVisitorInformation:', error.message);
    // Return partial data if some calls failed
    return {
      weather: {},
      bestTimes: {},
      localInfo: {},
      accessibility: {},
      transportation: {}
    };
  }
};

// Get timezone information for a location
const getTimezoneInfo = async (location) => {
  try {
    // Skip cache check and always fetch fresh data
    console.log('Fetching fresh timezone data from Google API');
    
    if (!location.lat || !location.lng) {
      return null;
    }

    const response = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/timezone/json`, {
      params: {
        location: `${location.lat},${location.lng}`,
        timestamp: Math.floor(Date.now() / 1000),
        key: API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Failed to get timezone info: ${response.data.status}`);
    }

    const timezoneInfo = {
      timeZoneId: response.data.timeZoneId,
      timeZoneName: response.data.timeZoneName,
      dstOffset: response.data.dstOffset,
      rawOffset: response.data.rawOffset
    };
    
    // Still cache the result for potential future use
    const cacheKey = `timezone_${location.lat}_${location.lng}`;
    await setInCache('timezone', cacheKey, timezoneInfo);
    return timezoneInfo;
  } catch (error) {
    console.error('Error in getTimezoneInfo:', error.message);
    return null;
  }
};

// Placeholder for other services that might be implemented
const getLocationCurrencyInfo = async (placeId) => {
  // This would be implemented with a real currency API
  return {
    currencyCode: 'USD',
    currencyName: 'US Dollar',
    currencySymbol: '$'
  };
};

const getSafetyInfo = async (placeId) => {
  // This would be implemented with a safety information API
  return {
    safetyLevel: 'High',
    safetyTips: [
      'Keep your valuables secure',
      'Stay aware of your surroundings',
      'Use registered transportation'
    ]
  };
};

const getAccessibilityInfo = async (placeId) => {
  // This would be implemented with accessibility information
  return {
    wheelchairAccessible: true,
    publicTransportAccessible: true,
    accessibilityNotes: 'Most major attractions are wheelchair accessible'
  };
};

const getTransportationInfo = async (location) => {
  // This would be implemented with transportation API
  return {
    publicTransport: true,
    rentalCars: true,
    taxis: true,
    transportationTips: [
      'Public transportation is widely available',
      'Taxis are readily accessible in most areas',
      'Rental cars are recommended for exploring outside the city'
    ]
  };
};

module.exports = {
  searchPlace,
  getPlaceDetails,
  getPlacePhotos,
  getNearbyAttractions,
  getNearbyHotels,
  getNearbyRestaurants,
  getPlaceAutocomplete,
  getPlaceWeather,
  getPopularTimes,
  // New enhanced functions
  getEnhancedPlaceDetails,
  getHighQualityPlacePhotos,
  getVisitorInformation,
  getTimezoneInfo
}; 