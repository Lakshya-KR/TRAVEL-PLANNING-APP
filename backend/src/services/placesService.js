const axios = require('axios');
const { getFromCache, setInCache } = require('./cacheService');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_MAPS_API_BASE_URL = 'https://maps.googleapis.com/maps/api';

const searchPlaces = async (query) => {
  try {
    // Check cache first
    const cachedResults = await getFromCache('search_results', query);
    if (cachedResults) {
      return cachedResults;
    }

    const response = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/place/textsearch/json`, {
      params: {
        query: `${query} tourist destination`,
        key: GOOGLE_PLACES_API_KEY,
        type: 'tourist_attraction',
        language: 'en'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API Error: ${response.data.status}`);
    }

    const places = await Promise.all(response.data.results.map(async (place) => {
      // Get photo reference for the first photo
      const photoReference = place.photos?.[0]?.photo_reference;
      let photoUrl = null;

      if (photoReference) {
        photoUrl = `${GOOGLE_MAPS_API_BASE_URL}/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
      }

      return {
        place_id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        photoUrl,
        location: place.geometry.location
      };
    }));

    // Cache the results
    await setInCache('search_results', query, places);
    return places;
  } catch (error) {
    console.error('Error in searchPlaces:', error);
    throw error;
  }
};

const getPlaceDetails = async (placeId) => {
  try {
    // Check cache first
    const cachedDetails = await getFromCache('place_details', placeId);
    if (cachedDetails) {
      return cachedDetails;
    }

    const response = await axios.get(`${GOOGLE_MAPS_API_BASE_URL}/place/details/json`, {
      params: {
        place_id: placeId,
        key: GOOGLE_PLACES_API_KEY,
        fields: 'name,rating,formatted_phone_number,formatted_address,opening_hours,website,price_level,review,photo,type,url'
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Failed to get place details: ${response.data.status}`);
    }

    const details = response.data.result;

    // Get all photos
    const photos = await Promise.all(
      (details.photos || []).map(async (photo) => ({
        url: `${GOOGLE_MAPS_API_BASE_URL}/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
        thumbnail: `${GOOGLE_MAPS_API_BASE_URL}/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
      }))
    );

    // Get weather information
    const weather = await getWeather(details.geometry.location);

    const placeDetails = {
      name: details.name,
      address: details.formatted_address,
      phone: details.formatted_phone_number,
      rating: details.rating,
      website: details.website,
      url: details.url,
      priceLevel: details.price_level,
      photos,
      reviews: details.reviews?.map(review => ({
        authorName: review.author_name,
        authorPhoto: review.profile_photo_url,
        rating: review.rating,
        text: review.text,
        relativeTime: review.relative_time_description
      })) || [],
      openingHours: details.opening_hours?.weekday_text || [],
      weather
    };

    // Cache the details
    await setInCache('place_details', placeId, placeDetails);
    return placeDetails;
  } catch (error) {
    console.error('Error in getPlaceDetails:', error);
    throw error;
  }
};

const getWeather = async (location) => {
  try {
    const cacheKey = `${location.lat},${location.lng}`;
    const cachedWeather = await getFromCache('weather', cacheKey);
    if (cachedWeather) {
      return cachedWeather;
    }

    // Using OpenWeatherMap API for weather data
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: location.lat,
        lon: location.lng,
        appid: process.env.OPENWEATHERMAP_API_KEY,
        units: 'metric'
      }
    });

    const weatherData = {
      temperature: response.data.main.temp,
      description: response.data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed
    };

    // Cache the weather data
    await setInCache('weather', cacheKey, weatherData);
    return weatherData;
  } catch (error) {
    console.error('Error in getWeather:', error);
    return null;
  }
};

module.exports = {
  searchPlaces,
  getPlaceDetails
}; 