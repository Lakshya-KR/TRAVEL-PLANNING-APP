// Configuration file for the frontend application

// API endpoints
const API_BASE_URL = 'http://localhost:5000/api';

// Maps configuration for the frontend
const MAPS_CONFIG = {
  // When using the static Maps API in the frontend, the key should be restricted to HTTP referrers
  // in the Google Cloud Console to prevent unauthorized use
  STATIC_MAPS_URL: 'https://maps.googleapis.com/maps/api/staticmap',
  // This allows the backend to handle the actual API key securely
  getStaticMapUrl: (location, size, mapType, marker = false) => {
    if (!location || !location.lat || !location.lng) {
      console.warn('Invalid location provided to getStaticMapUrl', location);
      // Return a default Paris map if no location
      location = { lat: 48.8584, lng: 2.2945 };
    }
    
    const baseUrl = `${API_BASE_URL}/maps/static`;
    const params = new URLSearchParams({
      center: `${location.lat},${location.lng}`,
      zoom: '13',
      size,
      maptype: mapType || 'roadmap',
      timestamp: Date.now() // Add timestamp to prevent caching
    });
    
    if (marker) {
      params.append('markers', `color:red|${location.lat},${location.lng}`);
    }
    
    return `${baseUrl}?${params.toString()}`;
  },
  
  // Get a direct static image URL for search results and cards
  getPlaceImageUrl: (place) => {
    if (!place) return null;
    
    // Add unique timestamp to prevent browser caching
    const timestamp = Date.now();
    
    // If the place has a photo URL, use that
    if (place.photos && place.photos.length > 0) {
      const photo = place.photos[0];
      const photoUrl = photo.url || photo.medium || photo.thumbnail;
      
      // Only add timestamp if it's our own API URL, not Google's
      if (photoUrl && photoUrl.startsWith(API_BASE_URL)) {
        return `${photoUrl}${photoUrl.includes('?') ? '&' : '?'}timestamp=${timestamp}`;
      }
      return photoUrl;
    }
    
    // If we have a place_id, use the place-photo endpoint
    if (place.place_id) {
      console.log('Using place-photo endpoint for', place.name);
      return `${API_BASE_URL}/maps/place-photo?place_id=${place.place_id}&maxwidth=400&timestamp=${timestamp}`;
    }
    
    // Otherwise use a static map of the location
    if (place.location && place.location.lat && place.location.lng) {
      console.log('Using static map with coordinates for', place.name);
      const locationParams = new URLSearchParams({
        center: `${place.location.lat},${place.location.lng}`,
        zoom: '14',
        size: '400x300',
        maptype: 'satellite',
        markers: `color:red|${place.location.lat},${place.location.lng}`,
        timestamp
      });
      return `${API_BASE_URL}/maps/static?${locationParams.toString()}`;
    }
    
    // Fallback to place name as the center
    console.log('Using name-based fallback for', place.name);
    return `${API_BASE_URL}/maps/static?center=${encodeURIComponent(place.name)}&zoom=13&size=400x300&maptype=satellite&markers=color:red|${encodeURIComponent(place.name)}&timestamp=${timestamp}`;
  }
};

export {
  API_BASE_URL,
  MAPS_CONFIG
}; 