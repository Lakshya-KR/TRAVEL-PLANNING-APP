const express = require('express');
const axios = require('axios');
const path = require('path');
const router = express.Router();

// Get the API key from environment variables
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error('GOOGLE_PLACES_API_KEY is not set in environment variables');
  throw new Error('Google Maps API key is required');
}

// Proxy for Google Maps Static API
router.get('/static', async (req, res) => {
  try {
    // Extract parameters from query
    const { center, zoom, size, maptype, markers } = req.query;
    
    console.log('Static Maps request received:', { center, zoom, size, maptype, markers });
    
    if (!center || !size) {
      console.log('Missing required parameters, serving placeholder');
      return res.sendFile(path.join(__dirname, '../../public/placeholder-map.svg'));
    }
    
    // Allow direct place_id references for more precise maps
    const place_id = req.query.place_id;
    let location = center;
    
    // If place_id is provided, get the actual coordinates first
    if (place_id) {
      try {
        console.log('Fetching coordinates for place_id:', place_id);
        const response = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
          params: {
            place_id,
            fields: 'geometry',
            key: GOOGLE_MAPS_API_KEY
          }
        });
        
        if (response.data.status === 'OK' && response.data.result && response.data.result.geometry) {
          const lat = response.data.result.geometry.location.lat;
          const lng = response.data.result.geometry.location.lng;
          location = `${lat},${lng}`;
          console.log('Using coordinates from place_id:', location);
        }
      } catch (placeError) {
        console.error('Error fetching place details:', placeError.message);
        // Continue with the provided center coordinates
      }
    }
    
    // Build the Google Static Maps URL
    const params = new URLSearchParams({
      center: location,
      zoom: zoom || '13',
      size,
      maptype: maptype || 'roadmap',
      key: GOOGLE_MAPS_API_KEY
    });
    
    if (markers) {
      params.append('markers', markers);
    }
    
    // Add a timestamp to prevent caching
    params.append('timestamp', new Date().getTime());
    
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
    console.log('Making request to Google Static Maps API');
    
    // Fetch the image from Google
    const response = await axios.get(mapUrl, {
      responseType: 'arraybuffer',
      timeout: 5000
    });
    
    console.log('Google Maps API response received, Content-Type:', response.headers['content-type']);
    
    // Set appropriate headers
    res.set('Content-Type', response.headers['content-type']);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate'); // Prevent caching
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // Send the image data
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching static map:', error.message);
    // Send the placeholder SVG file instead of redirecting
    res.sendFile(path.join(__dirname, '../../public/placeholder-map.svg'));
  }
});

// Add a route to get a photo directly from a place_id
router.get('/place-photo', async (req, res) => {
  try {
    const { place_id, maxwidth } = req.query;
    const width = maxwidth || 400;
    
    if (!place_id) {
      console.log('Missing place_id parameter, serving placeholder');
      return res.sendFile(path.join(__dirname, '../../public/placeholder-map.svg'));
    }
    
    console.log('Fetching photo for place_id:', place_id);
    
    // First, get place details to find photo references
    const detailsResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
      params: {
        place_id,
        fields: 'photos,name',
        key: GOOGLE_MAPS_API_KEY
      }
    });
    
    // Log the name of the place for debugging
    if (detailsResponse.data.result && detailsResponse.data.result.name) {
      console.log(`Place name: ${detailsResponse.data.result.name}`);
    }
    
    // Check if we have valid photos
    if (detailsResponse.data.status !== 'OK' || 
        !detailsResponse.data.result || 
        !detailsResponse.data.result.photos || 
        detailsResponse.data.result.photos.length === 0) {
      console.log('No photos found for place_id:', place_id);
      // Fallback to a static map if no photos available
      return res.redirect(`/api/maps/static?place_id=${place_id}&zoom=14&size=400x300&maptype=satellite&timestamp=${Date.now()}`);
    }
    
    // Log the number of photos found
    console.log(`Found ${detailsResponse.data.result.photos.length} photos for this place`);
    
    // Get the first photo reference
    const photoReference = detailsResponse.data.result.photos[0].photo_reference;
    console.log('Photo reference:', photoReference);
    
    // Now get the actual photo with a timestamp to prevent caching
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${width}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}&timestamp=${Date.now()}`;
    console.log('Fetching photo from URL:', photoUrl);
    
    try {
      const photoResponse = await axios.get(photoUrl, {
        responseType: 'arraybuffer',
        timeout: 5000
      });
      
      // Set appropriate headers
      res.set('Content-Type', photoResponse.headers['content-type']);
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      // Send the image data
      res.send(photoResponse.data);
    } catch (photoError) {
      console.error('Error fetching photo from Google API:', photoError.message);
      // Try with a different photo reference if available
      if (detailsResponse.data.result.photos.length > 1) {
        console.log('Trying alternative photo reference');
        const alternativePhotoRef = detailsResponse.data.result.photos[1].photo_reference;
        const alternativePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${width}&photo_reference=${alternativePhotoRef}&key=${GOOGLE_MAPS_API_KEY}&timestamp=${Date.now()}`;
        
        try {
          const alternativeResponse = await axios.get(alternativePhotoUrl, {
            responseType: 'arraybuffer',
            timeout: 5000
          });
          
          res.set('Content-Type', alternativeResponse.headers['content-type']);
          res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.send(alternativeResponse.data);
          return;
        } catch (altError) {
          console.error('Error fetching alternative photo:', altError.message);
          // Fall through to placeholder
        }
      }
      
      // Send placeholder as last resort
      res.sendFile(path.join(__dirname, '../../public/placeholder-map.svg'));
    }
  } catch (error) {
    console.error('Error in place-photo route:', error.message);
    // Send the placeholder SVG file as fallback
    res.sendFile(path.join(__dirname, '../../public/placeholder-map.svg'));
  }
});

module.exports = router; 