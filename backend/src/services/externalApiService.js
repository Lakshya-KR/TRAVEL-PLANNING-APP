const axios = require('axios');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

const fetchImages = async (query) => {
  const cacheKey = `images_${query}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5`,
      {
        headers: {
          'Authorization': `Client-ID ${process.env.UNSPLASH_KEY}`
        }
      }
    );

    const images = response.data.results.map(photo => ({
      url: photo.urls.regular,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html
    }));

    cache.set(cacheKey, images);
    return images;
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
};

const fetchVideos = async (query) => {
  const cacheKey = `videos_${query}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=3`,
      {
        headers: {
          'Authorization': process.env.PEXELS_KEY
        }
      }
    );

    const videos = response.data.videos.map(video => ({
      url: video.video_files.find(file => file.quality === 'sd').link,
      thumbnail: video.image,
      photographer: video.user.name,
      photographerUrl: video.user.url
    }));

    cache.set(cacheKey, videos);
    return videos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
};

const fetchLocationDetails = async (query) => {
  const cacheKey = `location_${query}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
    );

    if (!response.data || response.data.length === 0) {
      return null;
    }

    const location = response.data[0];
    const result = {
      name: location.display_name,
      coordinates: { lat: location.lat, lon: location.lon }
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching location details:', error);
    return null;
  }
};

const fetchAttractions = async (lat, lon) => {
  const cacheKey = `attractions_${lat}_${lon}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=10000&lon=${lon}&lat=${lat}&kinds=accomodations,interesting_places,cultural,restaurants&format=json&apikey=${process.env.OPENTRIPMAP_KEY}`
    );

    const attractions = response.data.map(place => ({
      name: place.name,
      description: place.wikipedia_extracts?.text || 'No description available',
      rating: place.rate,
      distance: place.dist,
      image: place.preview?.source || null
    }));

    cache.set(cacheKey, attractions);
    return attractions;
  } catch (error) {
    console.error('Error fetching attractions:', error);
    return [];
  }
};

module.exports = {
  fetchImages,
  fetchVideos,
  fetchLocationDetails,
  fetchAttractions
};