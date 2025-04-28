import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Tab } from '@headlessui/react';
import { API_BASE_URL, MAPS_CONFIG } from '../config';

const SkeletonLoader = ({ type }) => {
  if (type === 'text') {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div>
        <div className="h-4 bg-gray-700 rounded animate-pulse w-full"></div>
        <div className="h-4 bg-gray-700 rounded animate-pulse w-5/6"></div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="bg-gray-900/50 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="aspect-video bg-gray-700 animate-pulse"></div>
        <div className="p-4 space-y-3">
          <div className="h-6 bg-gray-700 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-gray-700 rounded animate-pulse w-5/6"></div>
        </div>
      </div>
    );
  }
};

const SectionStatus = ({ status, section }) => {
  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span>Loading {section}...</span>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="flex items-center space-x-2 text-red-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Failed to load {section}</span>
      </div>
    );
  }
  
  if (status === 'success') {
    return (
      <div className="flex items-center space-x-2 text-green-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>{section} loaded successfully</span>
      </div>
    );
  }
  
  return null;
};

const DestinationDetails = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [days, setDays] = useState(3);
  const [generatingItinerary, setGeneratingItinerary] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState(null);
  const [loadingVisitorInfo, setLoadingVisitorInfo] = useState(true);
  const [photoGallery, setPhotoGallery] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [mapType, setMapType] = useState('roadmap');
  const [accessibilityDetails, setAccessibilityDetails] = useState(null);
  const [loadingAccessibility, setLoadingAccessibility] = useState(true);
  const [accessibilityScore, setAccessibilityScore] = useState(0);
  const [accessibilityFilters, setAccessibilityFilters] = useState({
    mobilityImpaired: true,
    visuallyImpaired: true,
    hearingImpaired: true,
    cognitiveImpairments: true,
    sensoryIssues: true
  });

  useEffect(() => {
    const fetchDestinationData = async () => {
      try {
        setLoading(true);
        
        // Get the location details with enhanced information
        const searchResponse = await axios.get(`${API_BASE_URL}/locations/search?q=${encodeURIComponent(name)}`);
        if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
          throw new Error('Location not found');
        }
        
        const locationData = searchResponse.data.results[0];
        
        // Fetch all destination details in one call with enhanced information
        const cleanName = locationData.name.split(',')[0].trim();
        const detailsResponse = await axios.get(`${API_BASE_URL}/destination/${encodeURIComponent(cleanName)}`);
        
        // Process image data to create a gallery
        const images = detailsResponse.data.photos.map(photo => ({
          url: photo.large || photo.medium || photo.url,
          thumbnail: photo.thumbnail || photo.url,
          alt: detailsResponse.data.name
        }));

        // Set the destination data
        setDestination({
          name: detailsResponse.data.name,
          images: images,
          videos: detailsResponse.data.videos || [],
          content: detailsResponse.data.content || {},
          details: {
            ...detailsResponse.data.details,
            city: cleanName,
            country: locationData.display_name?.split(',').slice(-1)[0]?.trim() || ''
          },
          description: detailsResponse.data.details?.description || '',
          location: detailsResponse.data.details?.location || { lat: 0, lng: 0 }
        });

        // Set photo gallery for the image gallery section
        setPhotoGallery(images.slice(0, 8)); // Limit to 8 photos for gallery

        // Set visitor information
        setVisitorInfo(detailsResponse.data.visitorInfo || null);
        setLoadingVisitorInfo(false);
        
      } catch (err) {
        console.error('Error fetching destination:', err);
        setError(err.response?.data?.error || 'Failed to fetch destination details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDestinationData();
  }, [name]);

  useEffect(() => {
    // Fetch accessibility data
    const fetchAccessibilityData = async () => {
      try {
        setLoadingAccessibility(true);
        
        // Fetch enhanced accessibility data for the location
        const response = await axios.get(`${API_BASE_URL}/accessibility/${encodeURIComponent(name)}`);
        
        if (response.data) {
          setAccessibilityDetails(response.data);
          
          // Calculate accessibility score (0-100)
          const scoreFactors = [
            response.data.wheelchair ? 20 : 0,
            response.data.accessibleTransport ? 20 : 0,
            response.data.accessibleAccommodations ? 20 : 0,
            response.data.assistiveServices ? 20 : 0,
            response.data.sensoryAccommodations ? 20 : 0
          ];
          
          setAccessibilityScore(scoreFactors.reduce((a, b) => a + b, 0));
        }
      } catch (err) {
        console.error('Error fetching accessibility data:', err);
        // Set default values if API fails
        setAccessibilityDetails({
          wheelchair: visitorInfo?.accessibility?.wheelchairAccessible || false,
          accessibleTransport: visitorInfo?.accessibility?.publicTransportAccessible || false,
          accessibleAccommodations: false,
          assistiveServices: false,
          sensoryAccommodations: false,
          notes: visitorInfo?.accessibility?.accessibilityNotes || 'Information not available',
          detailedFeatures: []
        });
        setAccessibilityScore(20);
      } finally {
        setLoadingAccessibility(false);
      }
    };

    if (!loading && destination) {
      fetchAccessibilityData();
    }
  }, [name, loading, destination, visitorInfo]);

  const handleGenerateItinerary = async () => {
    try {
      setGeneratingItinerary(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/generate-itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: destination.name,
          days: days
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate itinerary');
      }

      const data = await response.json();
      if (!data.itinerary) {
        throw new Error('No itinerary content received');
      }

      // Navigate to the itinerary page with the enhanced itinerary format
      navigate('/generate-itinerary', {
        state: {
          itinerary: data.itinerary.days,
          destinationName: destination.name,
          generalTips: data.itinerary.generalTips,
          visitorInfo: data.visitorInfo
        },
      });
    } catch (err) {
      console.error('Error generating itinerary:', err);
      setError(err.message || 'Failed to generate itinerary');
      setTimeout(() => setError(null), 5000);
    } finally {
      setGeneratingItinerary(false);
    }
  };

  // Get Google Maps static image as fallback
  const getMapFallbackImage = (size = "800x600", mapType = "satellite", useMarker = true) => {
    // Default to Paris if no location
    const location = destination?.location || destination?.details?.location || { lat: 48.8584, lng: 2.2945 };
    
    try {
      return MAPS_CONFIG.getStaticMapUrl(location, size, mapType, useMarker);
    } catch (error) {
      console.error('Error generating map URL:', error);
      return `/placeholder-map.svg`;
    }
  };

  // Handle image loading errors
  const handleImageError = (imageId) => {
    console.log(`Image load error for: ${imageId}`);
    setImageLoadErrors(prev => ({
      ...prev,
      [imageId]: true
    }));
  };

  // Get appropriate image URL with fallback logic
  const getImageUrl = (image, index, type = 'primary') => {
    if (!image) {
      return getMapFallbackImage();
    }
    
    // If this specific image already had an error, use the fallback
    if (imageLoadErrors[`${index}-${type}`]) {
      return getMapFallbackImage();
    }
    
    // Otherwise use the appropriate URL from the image object
    if (type === 'thumbnail') {
      return image.thumbnail || image.url;
    }
    return image.url || image.large || image.medium;
  };

  // Filter accessibility features by disability type
  const getFilteredAccessibilityFeatures = () => {
    if (!accessibilityDetails || !accessibilityDetails.detailedFeatures) {
      return [];
    }
    
    return accessibilityDetails.detailedFeatures.filter(feature => {
      if (accessibilityFilters.mobilityImpaired && feature.category === 'mobility') return true;
      if (accessibilityFilters.visuallyImpaired && feature.category === 'visual') return true;
      if (accessibilityFilters.hearingImpaired && feature.category === 'hearing') return true;
      if (accessibilityFilters.cognitiveImpairments && feature.category === 'cognitive') return true;
      if (accessibilityFilters.sensoryIssues && feature.category === 'sensory') return true;
      return false;
    });
  };

  // Toggle accessibility filters
  const toggleAccessibilityFilter = (filterName) => {
    setAccessibilityFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Generate an accessible itinerary tailored for specific disabilities
  const generateAccessibleItinerary = async (disabilityTypes) => {
    try {
      setGeneratingItinerary(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/generate-accessible-itinerary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: destination.name,
          days: days,
          accessibilityNeeds: disabilityTypes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate accessible itinerary');
      }

      const data = await response.json();
      
      navigate('/generate-itinerary', {
        state: {
          itinerary: data.itinerary.days,
          destinationName: destination.name,
          generalTips: data.itinerary.generalTips,
          visitorInfo: data.visitorInfo,
          accessibilityFeatures: data.accessibilityFeatures
        },
      });
    } catch (err) {
      console.error('Error generating accessible itinerary:', err);
      setError(err.message || 'Failed to generate accessible itinerary');
      setTimeout(() => setError(null), 5000);
    } finally {
      setGeneratingItinerary(false);
    }
  };
  
  // Find accessible routes between points using Google Directions API
  const findAccessibleRoute = async (originRef, destinationRef) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/accessible-routes`, {
        params: {
          origin: originRef.name || originRef,
          destination: destinationRef.name || destinationRef,
          city: destination.name,
          wheelchair: true
        }
      });
      
      if (response.data && response.data.routes) {
        return {
          routeData: response.data.routes[0],
          status: 'success'
        };
      }
      
      return { status: 'error', message: 'No routes found' };
      
    } catch (error) {
      console.error('Error finding accessible route:', error);
      return { status: 'error', message: error.message };
    }
  };
  
  // Filter hotels by accessibility features
  const getAccessibleHotels = () => {
    if (!destination?.content?.hotels) {
      return [];
    }
    
    // If hotels exist in content, filter them by accessibility features
    return destination.content.hotels.filter(hotel => {
      // Look for accessibility keywords in description
      const description = hotel.description?.toLowerCase() || '';
      return description.includes('accessible') || 
             description.includes('wheelchair') || 
             description.includes('disability') || 
             description.includes('elevator') ||
             description.includes('disabled');
    });
  };

  // Render an accessible hotel card with accessibility details
  const renderAccessibleHotelCard = (hotel) => (
    <motion.div
      key={hotel.name}
      className="bg-blue-900/40 rounded-xl overflow-hidden backdrop-blur-sm border-l-4 border-blue-500"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="aspect-video relative">
        <img
          src={hotel.image || (destination.images[0] ? getImageUrl(destination.images[0], 0) : getMapFallbackImage("800x600", "satellite"))}
          alt={hotel.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log('Hotel image error:', hotel.name);
            e.target.src = getMapFallbackImage("800x600", "satellite");
          }}
        />
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
          Accessible
        </div>
      </div>
      <div className="p-4">
        <h4 className="text-xl font-semibold text-white mb-2">{hotel.name}</h4>
        <p className="text-gray-300">{hotel.description}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center px-2 py-1 bg-blue-800/60 rounded-full text-xs text-white">
            <span className="mr-1">♿</span> Wheelchair Accessible
          </span>
          <span className="inline-flex items-center px-2 py-1 bg-blue-800/60 rounded-full text-xs text-white">
            <span className="mr-1">🛌</span> Accessible Rooms
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-yellow-400">★</span>
            <span className="text-gray-300 ml-1">{hotel.rating}</span>
          </div>
          <span className="text-gray-300">{hotel.price || hotel.priceRange}</span>
        </div>
      </div>
    </motion.div>
  );

  // Render section with accessible hotels
  const renderAccessibleHotelsSection = () => {
    const accessibleHotels = getAccessibleHotels();

    if (accessibleHotels.length === 0) {
      // If no accessible hotels found in content, generate some mock accessible hotels
      const mockAccessibleHotels = [
        {
          name: `Accessible ${destination.name} Hotel`,
          description: "Fully accessible hotel with wheelchair ramps, elevators, and specially designed rooms for guests with disabilities. Includes visual and auditory accessibility features.",
          rating: 4.5,
          price: "$$$",
          image: destination.images[0] ? getImageUrl(destination.images[0], 0) : null
        },
        {
          name: `Inclusive Inn ${destination.name}`,
          description: "Designed with accessibility as a priority. Features include roll-in showers, lowered counters, and staff trained in disability assistance. Service animals welcome.",
          rating: 4.7,
          price: "$$",
          image: destination.images[1] ? getImageUrl(destination.images[1], 1) : null
        },
        {
          name: `${destination.name} Accessible Suites`,
          description: "All-suite hotel with spacious accessible rooms. Braille signage, hearing induction loops, and wheelchair accessible throughout. 24/7 assistance available.",
          rating: 4.3,
          price: "$$$",
          image: destination.images[2] ? getImageUrl(destination.images[2], 2) : null
        }
      ];
      
      return (
        <div className="space-y-6">
          <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-4">Accessible Accommodations</h3>
            <p className="text-gray-300 mb-6">Hotels with accessibility features for travelers with disabilities:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockAccessibleHotels.map(hotel => renderAccessibleHotelCard(hotel))}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-4">Accessible Accommodations</h3>
          <p className="text-gray-300 mb-6">Hotels with accessibility features for travelers with disabilities:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessibleHotels.map(hotel => renderAccessibleHotelCard(hotel))}
          </div>
        </div>
      </div>
    );
  };

  // Filter attractions by accessibility features
  const getAccessibleAttractions = () => {
    if (!destination?.content?.attractions) {
      return [];
    }
    
    // If attractions exist in content, filter them by accessibility features
    return destination.content.attractions.filter(attraction => {
      // Look for accessibility keywords in description
      const description = attraction.description?.toLowerCase() || '';
      return description.includes('accessible') || 
             description.includes('wheelchair') || 
             description.includes('disability') || 
             description.includes('elevator') ||
             description.includes('disabled');
    });
  };

  // Render an accessible attraction card with accessibility details
  const renderAccessibleAttractionCard = (attraction) => (
    <motion.div
      key={attraction.name}
      className="bg-green-900/40 rounded-xl overflow-hidden backdrop-blur-sm border-l-4 border-green-500"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="aspect-video relative">
        <img
          src={attraction.image || (destination.images[0] ? getImageUrl(destination.images[0], 0) : getMapFallbackImage("800x600", "satellite"))}
          alt={attraction.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log('Attraction image error:', attraction.name);
            e.target.src = getMapFallbackImage("800x600", "satellite");
          }}
        />
        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
          Accessible
        </div>
      </div>
      <div className="p-4">
        <h4 className="text-xl font-semibold text-white mb-2">{attraction.name}</h4>
        <p className="text-gray-300">{attraction.description}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center px-2 py-1 bg-green-800/60 rounded-full text-xs text-white">
            <span className="mr-1">♿</span> Wheelchair Accessible
          </span>
          <span className="inline-flex items-center px-2 py-1 bg-green-800/60 rounded-full text-xs text-white">
            <span className="mr-1">🚻</span> Accessible Facilities
          </span>
        </div>
        <div className="mt-3 flex items-center">
          <span className="text-yellow-400">★</span>
          <span className="text-gray-300 ml-1">{attraction.rating}</span>
        </div>
      </div>
    </motion.div>
  );

  // Filter restaurants by accessibility features
  const getAccessibleRestaurants = () => {
    if (!destination?.content?.restaurants) {
      return [];
    }
    
    // If restaurants exist in content, filter them by accessibility features
    return destination.content.restaurants.filter(restaurant => {
      // Look for accessibility keywords in description
      const description = restaurant.description?.toLowerCase() || '';
      return description.includes('accessible') || 
             description.includes('wheelchair') || 
             description.includes('disability') || 
             description.includes('elevator') ||
             description.includes('disabled');
    });
  };

  // Render an accessible restaurant card with accessibility details
  const renderAccessibleRestaurantCard = (restaurant) => (
    <motion.div
      key={restaurant.name}
      className="bg-purple-900/40 rounded-xl overflow-hidden backdrop-blur-sm border-l-4 border-purple-500"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="aspect-video relative">
        <img
          src={restaurant.image || (destination.images[0] ? getImageUrl(destination.images[0], 0) : getMapFallbackImage("800x600", "satellite"))}
          alt={restaurant.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log('Restaurant image error:', restaurant.name);
            e.target.src = getMapFallbackImage("800x600", "satellite");
          }}
        />
        <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
          Accessible
        </div>
      </div>
      <div className="p-4">
        <h4 className="text-xl font-semibold text-white mb-2">{restaurant.name}</h4>
        <p className="text-gray-300">{restaurant.description}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center px-2 py-1 bg-purple-800/60 rounded-full text-xs text-white">
            <span className="mr-1">♿</span> Wheelchair Accessible
          </span>
          <span className="inline-flex items-center px-2 py-1 bg-purple-800/60 rounded-full text-xs text-white">
            <span className="mr-1">📄</span> Accessible Menu
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-yellow-400">★</span>
            <span className="text-gray-300 ml-1">{restaurant.rating}</span>
          </div>
          <span className="text-gray-300">{restaurant.cuisine}</span>
        </div>
      </div>
    </motion.div>
  );

  // Render section with accessible attractions
  const renderAccessibleAttractionsSection = () => {
    const accessibleAttractions = getAccessibleAttractions();

    if (accessibleAttractions.length === 0) {
      // If no accessible attractions found in content, generate some mock accessible attractions
      const mockAccessibleAttractions = [
        {
          name: `${destination.name} Accessible Museum`,
          description: "Fully wheelchair accessible museum with ramps, elevators, and tactile exhibits for visually impaired visitors. Audio guides and sign language tours available.",
          rating: 4.6,
          image: destination.images[0] ? getImageUrl(destination.images[0], 0) : null
        },
        {
          name: `${destination.name} Accessible Nature Park`,
          description: "Accessible nature trails with smooth, paved paths suitable for wheelchairs and mobility aids. Rest areas, accessible restrooms, and sensory gardens.",
          rating: 4.8,
          image: destination.images[1] ? getImageUrl(destination.images[1], 1) : null
        },
        {
          name: `Inclusive Experience ${destination.name}`,
          description: "Designed specifically for visitors with disabilities. Features include tactile models, audio descriptions, sign language guides, and sensory-friendly spaces.",
          rating: 4.7,
          image: destination.images[2] ? getImageUrl(destination.images[2], 2) : null
        }
      ];
      
      return (
        <div className="space-y-6">
          <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-4">Accessible Attractions</h3>
            <p className="text-gray-300 mb-6">Places of interest with accessibility features for travelers with disabilities:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockAccessibleAttractions.map(attraction => renderAccessibleAttractionCard(attraction))}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-4">Accessible Attractions</h3>
          <p className="text-gray-300 mb-6">Places of interest with accessibility features for travelers with disabilities:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessibleAttractions.map(attraction => renderAccessibleAttractionCard(attraction))}
          </div>
        </div>
      </div>
    );
  };

  // Render section with accessible restaurants
  const renderAccessibleRestaurantsSection = () => {
    const accessibleRestaurants = getAccessibleRestaurants();

    if (accessibleRestaurants.length === 0) {
      // If no accessible restaurants found in content, generate some mock accessible restaurants
      const mockAccessibleRestaurants = [
        {
          name: `Accessible Dining ${destination.name}`,
          description: "Restaurant with wheelchair accessible entrance, spacious seating, and accessible bathrooms. Menus available in braille and large print. Trained staff for assistance.",
          rating: 4.4,
          cuisine: "International",
          image: destination.images[0] ? getImageUrl(destination.images[0], 0) : null
        },
        {
          name: `Inclusive Café ${destination.name}`,
          description: "Café designed with accessibility in mind. Features include step-free access, height-adjustable tables, and quiet zones for those with sensory sensitivities.",
          rating: 4.6,
          cuisine: "Café",
          image: destination.images[1] ? getImageUrl(destination.images[1], 1) : null
        },
        {
          name: `${destination.name} Accessible Bistro`,
          description: "Wheelchair accessible with accommodation for service animals. Staff trained in disability etiquette. Menus in multiple accessible formats available.",
          rating: 4.5,
          cuisine: "European",
          image: destination.images[2] ? getImageUrl(destination.images[2], 2) : null
        }
      ];
      
      return (
        <div className="space-y-6">
          <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-4">Accessible Restaurants</h3>
            <p className="text-gray-300 mb-6">Dining options with accessibility features for travelers with disabilities:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockAccessibleRestaurants.map(restaurant => renderAccessibleRestaurantCard(restaurant))}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-4">Accessible Restaurants</h3>
          <p className="text-gray-300 mb-6">Dining options with accessibility features for travelers with disabilities:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessibleRestaurants.map(restaurant => renderAccessibleRestaurantCard(restaurant))}
          </div>
        </div>
      </div>
    );
  };

  // Render accessibility services section
  const renderAccessibilityServicesSection = () => {
    // Mock accessibility services
    const accessibilityServices = [
      {
        name: "Equipment Rental",
        description: "Mobility equipment rental services for travelers with disabilities",
        services: [
          {
            name: `${destination.name} Mobility Rentals`,
            description: "Offers rental wheelchairs, mobility scooters, and other assistive devices. Delivery to hotels available.",
            contact: "+1-555-MOBILITY",
            website: "www.mobilityrental.example.com"
          },
          {
            name: "Accessible Travel Gear",
            description: "Rent specialized equipment for travelers with various disabilities, including sensory aids.",
            contact: "+1-555-ACCESS-GEAR",
            website: "www.accessiblegear.example.com"
          }
        ]
      },
      {
        name: "Personal Assistance",
        description: "Specialized assistance services for travelers with disabilities",
        services: [
          {
            name: "Accessible Travel Companions",
            description: "Professional assistants trained to support travelers with disabilities. Assistance with daily activities and sightseeing.",
            contact: "+1-555-ASSIST",
            website: "www.travelcompanions.example.com"
          },
          {
            name: `${destination.name} Access Guides`,
            description: "Local guides specialized in creating accessible tours and experiences for travelers with all types of disabilities.",
            contact: "+1-555-ACC-GUIDE",
            website: "www.accessguides.example.com"
          }
        ]
      },
      {
        name: "Translation & Interpretation",
        description: "Communication assistance for travelers with disabilities",
        services: [
          {
            name: "Sign Language Interpreters",
            description: "Professional sign language interpretation services for deaf and hard of hearing travelers.",
            contact: "+1-555-SIGN",
            website: "www.signinterpreters.example.com"
          },
          {
            name: "Accessibility Communication Support",
            description: "Provides communication tools and assistance for travelers with various disabilities.",
            contact: "+1-555-COMM-HELP",
            website: "www.accesscomm.example.com"
          }
        ]
      }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-4">Accessibility Services</h3>
          <p className="text-gray-300 mb-6">Support services available for travelers with disabilities:</p>
          
          <div className="space-y-6">
            {accessibilityServices.map((category, index) => (
              <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                  {category.name === "Equipment Rental" && <span className="mr-2">🦽</span>}
                  {category.name === "Personal Assistance" && <span className="mr-2">👋</span>}
                  {category.name === "Translation & Interpretation" && <span className="mr-2">🗣️</span>}
                  {category.name}
                </h4>
                <p className="text-gray-300 mb-4">{category.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.services.map((service, idx) => (
                    <div key={idx} className="bg-gray-700/50 p-3 rounded-lg">
                      <h5 className="font-semibold text-white">{service.name}</h5>
                      <p className="text-gray-300 text-sm mt-1">{service.description}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-gray-400 text-xs">Contact: {service.contact}</p>
                        <p className="text-blue-400 text-xs">Website: {service.website}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render accessibility travel tips section
  const renderAccessibilityTravelTipsSection = () => {
    // Mock accessibility travel tips
    const accessibilityTips = {
      general: [
        "Contact accommodations directly to confirm specific accessibility features before booking.",
        "Consider booking accommodations in central locations to minimize travel distances.",
        "Research accessibility of public transportation before your trip.",
        "Request assistance services at airports and train stations in advance.",
        "Carry documentation for medical equipment and service animals."
      ],
      mobility: [
        "Research terrain and street conditions at your destination.",
        "Check if tourist attractions offer wheelchair rentals or have accessible routes.",
        "Confirm elevator access in buildings you plan to visit.",
        "Look for accessible taxi services that can accommodate wheelchairs."
      ],
      visual: [
        "Contact museums and attractions to ask about touch tours or audio descriptions.",
        "Check if hotels offer braille signage or can provide information in accessible formats.",
        "Inquire about guide dog policies at accommodations and attractions.",
        "Consider destinations with good pedestrian infrastructure and auditory crossing signals."
      ],
      hearing: [
        "Research venues that offer captioning or hearing loop systems.",
        "Look for hotels with visual alarm systems and door knockers.",
        "Check if tours offer written materials or sign language interpretation.",
        "Consider carrying a communication card with key phrases."
      ],
      sensory: [
        "Research if attractions offer quiet hours or sensory-friendly experiences.",
        "Consider bringing noise-cancelling headphones for crowded or noisy environments.",
        "Look for accommodations that can provide quiet rooms away from elevators and ice machines.",
        "Plan breaks in your itinerary to avoid sensory overload."
      ]
    };

    return (
      <div className="space-y-6">
        <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-4">Accessibility Travel Tips</h3>
          <p className="text-gray-300 mb-6">Helpful tips for travelers with disabilities:</p>
          
          <div className="space-y-6">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-white mb-2">General Tips</h4>
              <ul className="text-gray-300 list-disc list-inside space-y-1">
                {accessibilityTips.general.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                  <span className="mr-2">♿</span> For Mobility Impairments
                </h4>
                <ul className="text-gray-300 list-disc list-inside space-y-1">
                  {accessibilityTips.mobility.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                  <span className="mr-2">👁️</span> For Visual Impairments
                </h4>
                <ul className="text-gray-300 list-disc list-inside space-y-1">
                  {accessibilityTips.visual.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                  <span className="mr-2">👂</span> For Hearing Impairments
                </h4>
                <ul className="text-gray-300 list-disc list-inside space-y-1">
                  {accessibilityTips.hearing.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                  <span className="mr-2">✋</span> For Sensory Sensitivities
                </h4>
                <ul className="text-gray-300 list-disc list-inside space-y-1">
                  {accessibilityTips.sensory.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the enhanced accessibility section
  const renderEnhancedAccessibilitySection = () => {
    if (loadingAccessibility) {
      return (
        <div className="space-y-6">
          <SectionStatus status="loading" section="Accessibility Information" />
          <SkeletonLoader type="text" />
        </div>
      );
    }

    if (!accessibilityDetails) {
      return (
        <div className="space-y-6">
          <SectionStatus status="error" section="Accessibility Information" />
          <p className="text-gray-400">Enhanced accessibility information is not available for this destination.</p>
        </div>
      );
    }

    const filteredFeatures = getFilteredAccessibilityFeatures();

    return (
      <div className="space-y-8">
        {/* Accessibility Score */}
        <div className="bg-blue-900/50 rounded-xl p-6 backdrop-blur-sm border-l-4 border-blue-500">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Accessibility Score</h3>
              <p className="text-gray-300 mb-4">Overall rating for travelers with disabilities</p>
            </div>
            <div className="flex items-center space-x-3 bg-blue-800/60 px-4 py-2 rounded-lg">
              <div className="text-3xl font-bold text-white">{accessibilityScore}</div>
              <div className="text-gray-300">/100</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <div className={`p-3 rounded-lg text-center ${accessibilityDetails.wheelchair ? 'bg-green-800/60' : 'bg-gray-800/60'}`}>
              <span className="block text-2xl mb-1">{accessibilityDetails.wheelchair ? '♿' : '❌'}</span>
              <span className="text-sm">Wheelchair Access</span>
            </div>
            <div className={`p-3 rounded-lg text-center ${accessibilityDetails.accessibleTransport ? 'bg-green-800/60' : 'bg-gray-800/60'}`}>
              <span className="block text-2xl mb-1">{accessibilityDetails.accessibleTransport ? '🚌' : '❌'}</span>
              <span className="text-sm">Transport</span>
            </div>
            <div className={`p-3 rounded-lg text-center ${accessibilityDetails.accessibleAccommodations ? 'bg-green-800/60' : 'bg-gray-800/60'}`}>
              <span className="block text-2xl mb-1">{accessibilityDetails.accessibleAccommodations ? '🏨' : '❌'}</span>
              <span className="text-sm">Accommodations</span>
            </div>
            <div className={`p-3 rounded-lg text-center ${accessibilityDetails.assistiveServices ? 'bg-green-800/60' : 'bg-gray-800/60'}`}>
              <span className="block text-2xl mb-1">{accessibilityDetails.assistiveServices ? '👋' : '❌'}</span>
              <span className="text-sm">Assistive Services</span>
            </div>
            <div className={`p-3 rounded-lg text-center ${accessibilityDetails.sensoryAccommodations ? 'bg-green-800/60' : 'bg-gray-800/60'}`}>
              <span className="block text-2xl mb-1">{accessibilityDetails.sensoryAccommodations ? '👂' : '❌'}</span>
              <span className="text-sm">Sensory Support</span>
            </div>
          </div>
        </div>

        {/* Accessibility Filters */}
        <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white mb-4">Filter by Disability Type</h3>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => toggleAccessibilityFilter('mobilityImpaired')} 
              className={`px-3 py-1 rounded-full text-sm ${accessibilityFilters.mobilityImpaired ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Mobility Impaired
            </button>
            <button 
              onClick={() => toggleAccessibilityFilter('visuallyImpaired')} 
              className={`px-3 py-1 rounded-full text-sm ${accessibilityFilters.visuallyImpaired ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Visually Impaired
            </button>
            <button 
              onClick={() => toggleAccessibilityFilter('hearingImpaired')} 
              className={`px-3 py-1 rounded-full text-sm ${accessibilityFilters.hearingImpaired ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Hearing Impaired
            </button>
            <button 
              onClick={() => toggleAccessibilityFilter('cognitiveImpairments')} 
              className={`px-3 py-1 rounded-full text-sm ${accessibilityFilters.cognitiveImpairments ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Cognitive Impairments
            </button>
            <button 
              onClick={() => toggleAccessibilityFilter('sensoryIssues')} 
              className={`px-3 py-1 rounded-full text-sm ${accessibilityFilters.sensoryIssues ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              Sensory Issues
            </button>
          </div>
        </div>

        {/* Detailed Accessibility Features */}
        <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-4">Detailed Accessibility Features</h3>
          
          {filteredFeatures.length === 0 ? (
            <p className="text-gray-400">No specific features matching your filters.</p>
          ) : (
            <div className="space-y-4">
              {filteredFeatures.map((feature, index) => (
                <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {feature.category === 'mobility' && '♿'}
                      {feature.category === 'visual' && '👁️'}
                      {feature.category === 'hearing' && '👂'}
                      {feature.category === 'cognitive' && '🧠'}
                      {feature.category === 'sensory' && '✋'}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{feature.name}</h4>
                      <p className="text-gray-300">{feature.description}</p>
                      {feature.location && (
                        <p className="text-gray-400 text-sm mt-1">Location: {feature.location}</p>
                      )}
                      {feature.hours && (
                        <p className="text-gray-400 text-sm">Hours: {feature.hours}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accessibility Travel Tips */}
        {renderAccessibilityTravelTipsSection()}

        {/* Accessible Attractions Section */}
        {renderAccessibleAttractionsSection()}

        {/* Accessible Hotels Section */}
        {renderAccessibleHotelsSection()}

        {/* Accessible Restaurants Section */}
        {renderAccessibleRestaurantsSection()}

        {/* Accessibility Services */}
        {renderAccessibilityServicesSection()}

        {/* Accessible Itinerary Generator */}
        <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-4">Generate Accessible Itinerary</h3>
          <p className="text-gray-300 mb-4">Create a customized itinerary based on your specific accessibility needs.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-white block mb-2">Number of Days</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 5, 7].map(d => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`px-3 py-1 rounded ${days === d ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-white block mb-2">Accessibility Needs</label>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="mobility" 
                    checked={accessibilityFilters.mobilityImpaired}
                    onChange={() => toggleAccessibilityFilter('mobilityImpaired')}
                    className="rounded bg-gray-700 border-0 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="mobility" className="text-gray-300 text-sm">Mobility</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="visual" 
                    checked={accessibilityFilters.visuallyImpaired}
                    onChange={() => toggleAccessibilityFilter('visuallyImpaired')}
                    className="rounded bg-gray-700 border-0 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="visual" className="text-gray-300 text-sm">Visual</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="hearing" 
                    checked={accessibilityFilters.hearingImpaired}
                    onChange={() => toggleAccessibilityFilter('hearingImpaired')}
                    className="rounded bg-gray-700 border-0 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="hearing" className="text-gray-300 text-sm">Hearing</label>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => generateAccessibleItinerary(
              Object.entries(accessibilityFilters)
                .filter(([_, value]) => value)
                .map(([key]) => key)
            )}
            disabled={generatingItinerary}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
          >
            {generatingItinerary ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating Accessible Itinerary...
              </>
            ) : (
              'Generate Accessible Itinerary'
            )}
          </button>
        </div>

        {/* Accessible Transportation */}
        <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-4">Accessible Transportation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-white mb-2">Public Transport</h4>
              <div className="flex items-center mb-2">
                <span className={`text-${accessibilityDetails.accessibleTransport ? 'green' : 'red'}-500 mr-2`}>
                  {accessibilityDetails.accessibleTransport ? '✓' : '✗'}
                </span>
                <span className="text-gray-300">Wheelchair Accessible Transport</span>
              </div>
              <p className="text-gray-400 text-sm">{accessibilityDetails.transportNotes || 'No specific information available.'}</p>
              
              <div className="mt-4">
                <h5 className="font-semibold text-white mb-2">Accessible Options:</h5>
                <ul className="text-gray-300 space-y-1 list-disc list-inside">
                  {accessibilityDetails.transportOptions?.map((option, idx) => (
                    <li key={idx}>{option}</li>
                  )) || [
                    'Information not available'
                  ]}
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-white mb-2">Specialized Services</h4>
              <div className="space-y-3">
                {accessibilityDetails.specializedTransport?.map((service, idx) => (
                  <div key={idx} className="border-b border-gray-700 pb-2 last:border-0">
                    <h5 className="font-semibold text-white">{service.name}</h5>
                    <p className="text-gray-300 text-sm">{service.description}</p>
                    {service.contact && (
                      <p className="text-blue-400 text-sm mt-1">Contact: {service.contact}</p>
                    )}
                  </div>
                )) || (
                  <p className="text-gray-400">No specialized transportation services available.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Medical & Emergency Services */}
        <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-4">Medical & Emergency Services</h3>
          
          <div className="bg-red-900/30 p-4 rounded-lg mb-4 border border-red-700">
            <div className="flex items-center mb-2">
              <span className="text-red-500 mr-2">⚠️</span>
              <h4 className="text-lg font-semibold text-white">Emergency Contact</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-gray-400 text-sm">Local Emergency:</p>
                <p className="text-white font-semibold">{accessibilityDetails.emergencyNumber || '112/911'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Medical Emergency:</p>
                <p className="text-white font-semibold">{accessibilityDetails.medicalEmergencyNumber || '112/911'}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accessibilityDetails.medicalFacilities?.map((facility, idx) => (
              <div key={idx} className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-1">{facility.name}</h4>
                <p className="text-gray-300 text-sm">{facility.description}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-gray-400 text-sm">Address: {facility.address}</p>
                  <p className="text-gray-400 text-sm">Phone: {facility.phone}</p>
                  {facility.website && (
                    <p className="text-blue-400 text-sm">Website: {facility.website}</p>
                  )}
                  {facility.accessibilityFeatures && (
                    <div className="mt-2">
                      <span className="text-gray-300 text-sm">Accessibility: {facility.accessibilityFeatures}</span>
                    </div>
                  )}
                </div>
              </div>
            )) || (
              <p className="text-gray-400 col-span-2">No detailed medical facility information available.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl mb-4">Error</h2>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const renderContentSection = (title, content) => (
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <div className="prose prose-invert max-w-none">
        {Array.isArray(content) 
          ? (
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              {content.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) 
          : (
            <p className="text-gray-300">{content}</p>
          )
        }
      </div>
    </div>
  );

  const renderAttractionCard = (attraction) => (
    <motion.div
      key={attraction.name}
      className="bg-gray-900/50 rounded-xl overflow-hidden backdrop-blur-sm"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="aspect-video relative">
        <img
          src={attraction.image || (destination.images[0] ? getImageUrl(destination.images[0], 0) : getMapFallbackImage("800x600", "satellite"))}
          alt={attraction.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log('Attraction image error:', attraction.name);
            e.target.src = getMapFallbackImage("800x600", "satellite");
          }}
        />
      </div>
      <div className="p-4">
        <h4 className="text-xl font-semibold text-white mb-2">{attraction.name}</h4>
        <p className="text-gray-400">{attraction.description}</p>
        {attraction.rating && (
          <div className="mt-2 flex items-center">
            <span className="text-yellow-400">★</span>
            <span className="text-gray-300 ml-1">{attraction.rating}</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderHotelCard = (hotel) => (
    <motion.div
      key={hotel.name}
      className="bg-gray-900/50 rounded-xl overflow-hidden backdrop-blur-sm"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="aspect-video relative">
        <img
          src={hotel.image || (destination.images[0] ? getImageUrl(destination.images[0], 0) : getMapFallbackImage("800x600", "satellite"))}
          alt={hotel.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log('Hotel image error:', hotel.name);
            e.target.src = getMapFallbackImage("800x600", "satellite");
          }}
        />
      </div>
      <div className="p-4">
        <h4 className="text-xl font-semibold text-white mb-2">{hotel.name}</h4>
        <p className="text-gray-400">{hotel.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-yellow-400">★</span>
            <span className="text-gray-300 ml-1">{hotel.rating}</span>
          </div>
          <span className="text-gray-300">{hotel.price}</span>
        </div>
      </div>
    </motion.div>
  );

  const renderRestaurantCard = (restaurant) => (
    <motion.div
      key={restaurant.name}
      className="bg-gray-900/50 rounded-xl overflow-hidden backdrop-blur-sm"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="aspect-video relative">
        <img
          src={restaurant.image || (destination.images[0] ? getImageUrl(destination.images[0], 0) : getMapFallbackImage("800x600", "satellite"))}
          alt={restaurant.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log('Restaurant image error:', restaurant.name);
            e.target.src = getMapFallbackImage("800x600", "satellite");
          }}
        />
      </div>
      <div className="p-4">
        <h4 className="text-xl font-semibold text-white mb-2">{restaurant.name}</h4>
        <p className="text-gray-400">{restaurant.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-yellow-400">★</span>
            <span className="text-gray-300 ml-1">{restaurant.rating}</span>
          </div>
          <span className="text-gray-300">{restaurant.cuisine}</span>
        </div>
      </div>
    </motion.div>
  );

  const renderItinerarySection = () => (
    <div className="space-y-6">
      <div className="mt-10 text-center space-y-4">
        <label className="block text-lg font-semibold text-white">Select Days:</label>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="bg-gray-800 text-white px-4 py-2 rounded-full"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <option key={d} value={d}>
              {d} day{d > 1 && "s"}
            </option>
          ))}
        </select>

        <button
          onClick={handleGenerateItinerary}
          disabled={generatingItinerary}
          className="block mx-auto mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-full text-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatingItinerary ? (
            <div className="flex items-center gap-2 justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generating...</span>
            </div>
          ) : (
            '📅 Show the Itinerary'
          )}
        </button>
      </div>

      <div className="prose prose-invert max-w-none mt-6">
        <p className="text-gray-300 text-center">
          Generate a personalized {days}-day itinerary for your trip to {destination?.name}. 
          The itinerary will include:
        </p>
        <ul className="list-disc list-inside text-gray-300 space-y-2 text-center">
          <li>Daily activities and attractions</li>
          <li>Restaurant recommendations</li>
          <li>Optimal visit timing</li>
          <li>Travel tips specific to your duration</li>
        </ul>
      </div>
    </div>
  );

  const renderVisitorInfoSection = () => {
    if (loadingVisitorInfo) {
      return (
        <div className="space-y-6">
          <SectionStatus status="loading" section="Visitor Information" />
          <SkeletonLoader type="text" />
        </div>
      );
    }

    if (!visitorInfo) {
      return (
        <div className="space-y-6">
          <SectionStatus status="error" section="Visitor Information" />
          <p className="text-gray-400">Visitor information is not available for this destination.</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Weather Information */}
        {visitorInfo.weather && (
          <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-4">Weather & Climate</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {visitorInfo.weather.currentWeather && (
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-2">Current Weather</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl text-white">{visitorInfo.weather.currentWeather.temperature}°</p>
                      <p className="text-gray-400">{visitorInfo.weather.currentWeather.condition}</p>
                    </div>
                    <div className="text-yellow-400 text-3xl">
                      {visitorInfo.weather.currentWeather.condition.includes('sun') ? '☀️' : 
                       visitorInfo.weather.currentWeather.condition.includes('cloud') ? '☁️' : 
                       visitorInfo.weather.currentWeather.condition.includes('rain') ? '🌧️' : '🌡️'}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2">Best Season to Visit</h4>
                <p className="text-gray-300">{visitorInfo.weather.bestSeason || 'Year round'}</p>
                <p className="text-gray-400 text-sm mt-2">{visitorInfo.weather.seasonDetails || 'Data not available'}</p>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2">What to Pack</h4>
                <ul className="text-gray-300 list-disc list-inside space-y-1">
                  {(visitorInfo.weather.packingTips || ['Comfortable shoes', 'Weather appropriate clothing']).map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Local Information */}
        {visitorInfo.localInfo && (
          <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-4">Local Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visitorInfo.localInfo.currency && (
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-2">Currency</h4>
                  <p className="text-gray-300">{visitorInfo.localInfo.currency.currencyName} ({visitorInfo.localInfo.currency.currencyCode})</p>
                  <p className="text-gray-400 text-sm mt-2">Symbol: {visitorInfo.localInfo.currency.currencySymbol}</p>
                </div>
              )}
              
              {visitorInfo.localInfo.timezone && (
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-2">Time Zone</h4>
                  <p className="text-gray-300">{visitorInfo.localInfo.timezone.timeZoneName}</p>
                </div>
              )}
              
              {visitorInfo.localInfo.safety && (
                <div className="bg-gray-800/50 p-4 rounded-lg col-span-1 md:col-span-2">
                  <h4 className="text-lg font-semibold text-white mb-2">Safety Tips</h4>
                  <p className="text-gray-300 mb-2">Safety Level: {visitorInfo.localInfo.safety.safetyLevel}</p>
                  <ul className="text-gray-300 list-disc list-inside space-y-1">
                    {visitorInfo.localInfo.safety.safetyTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transportation Information */}
        {visitorInfo.transportation && (
          <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-4">Getting Around</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2">Available Transportation</h4>
                <ul className="text-gray-300 space-y-1">
                  {visitorInfo.transportation.publicTransport && <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Public Transport</li>}
                  {visitorInfo.transportation.rentalCars && <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Rental Cars</li>}
                  {visitorInfo.transportation.taxis && <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Taxis/Rideshare</li>}
                </ul>
              </div>
              
              <div className="bg-gray-800/50 p-4 rounded-lg col-span-1 md:col-span-2">
                <h4 className="text-lg font-semibold text-white mb-2">Transportation Tips</h4>
                <ul className="text-gray-300 list-disc list-inside space-y-1">
                  {(visitorInfo.transportation.transportationTips || ['Public transportation is recommended for getting around']).map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Accessibility Information */}
        {visitorInfo.accessibility && (
          <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-4">Accessibility</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2">Accessibility Features</h4>
                <ul className="text-gray-300 space-y-1">
                  {visitorInfo.accessibility.wheelchairAccessible && <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Wheelchair Accessible</li>}
                  {visitorInfo.accessibility.publicTransportAccessible && <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Accessible Public Transport</li>}
                </ul>
                <p className="text-gray-400 mt-3">{visitorInfo.accessibility.accessibilityNotes}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (section) => {
    if (section === 'accessibility') {
      return renderEnhancedAccessibilitySection();
    }
    
    if (!destination?.content) {
      return (
        <div className="space-y-4">
          <div className="grid gap-6">
            {section === 'overview' || section === 'travelTips' || section === 'culture' || section === 'itinerary' ? (
              <SkeletonLoader type="text" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <SkeletonLoader key={i} type="card" />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    const content = destination.content[section];
    
    // Handle empty arrays or undefined content gracefully
    if ((Array.isArray(content) && content.length === 0) || content === undefined) {
      if (section === 'overview' || section === 'travelTips' || section === 'culture') {
        return (
          <div className="text-gray-400 text-center py-8">
            <p>Content for {section} is being fetched from Google.</p>
            <p className="mt-2">Try generating an itinerary to see AI-powered content.</p>
          </div>
        );
      } else if (section === 'attractions' || section === 'hotels' || section === 'restaurants') {
        // Fetch from nearby data if content is empty
        const nearbyItems = destination?.details?.nearby?.[section] || [];
        if (nearbyItems.length > 0) {
          const mappedItems = nearbyItems.map(item => ({
            name: item.name,
            description: `A popular ${section === 'attractions' ? 'attraction' : section === 'hotels' ? 'accommodation' : 'restaurant'} in ${destination.name}.`,
            rating: item.rating || 4.0,
            image: item.photos?.[0]?.medium || item.photos?.[0]?.url,
            price: item.price_level ? Array(item.price_level).fill('$').join('') : undefined,
            cuisine: item.types?.filter(t => t !== 'restaurant' && t !== 'establishment')
              .map(t => t.replace('_', ' ')).join(', ')
          }));
          
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section === 'attractions' 
                ? mappedItems.map(attraction => renderAttractionCard(attraction))
                : section === 'hotels'
                  ? mappedItems.map(hotel => renderHotelCard(hotel))
                  : mappedItems.map(restaurant => renderRestaurantCard(restaurant))
              }
            </div>
          );
        }
      }
    }
    
    return (
      <div className="space-y-4">
        {(() => {
          switch (section) {
            case 'overview':
              return renderContentSection('Overview', content);
            case 'attractions':
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {content?.map(attraction => renderAttractionCard(attraction))}
                </div>
              );
            case 'hotels':
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {content?.map(hotel => renderHotelCard(hotel))}
                </div>
              );
            case 'restaurants':
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {content?.map(restaurant => renderRestaurantCard(restaurant))}
                </div>
              );
            case 'travelTips':
              return renderContentSection('Travel Tips', content);
            case 'culture':
              return renderContentSection('Local Culture', content);
            case 'itinerary':
              return renderItinerarySection();
            case 'visitorInfo':
              return renderVisitorInfoSection();
            case 'accessibility':
              return renderEnhancedAccessibilitySection();
            default:
              return null;
          }
        })()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[60vh]">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/80 z-10" />
        <img
          src={destination.images[0] ? getImageUrl(destination.images[0], 0) : getMapFallbackImage("1200x800", "satellite")}
          alt={destination.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log('Hero image error');
            handleImageError('hero');
            e.target.src = getMapFallbackImage("1200x800", "satellite");
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
            {destination.name}
          </h1>
          <p className="text-gray-300 text-lg">
            {destination.details?.city}, {destination.details?.country}
          </p>
          {destination.description && (
            <p className="text-gray-300 mt-4 max-w-3xl">
              {destination.description}
            </p>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Photo Gallery</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photoGallery.map((image, index) => (
            <motion.div
              key={index}
              className="aspect-square relative cursor-pointer overflow-hidden rounded-lg"
              onClick={() => setSelectedImage(image)}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <img
                src={getImageUrl(image, index, 'thumbnail')}
                alt={image.alt}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log('Gallery image error:', index);
                  handleImageError(`gallery-${index}`);
                  e.target.src = getMapFallbackImage("400x400", "roadmap");
                }}
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
            </motion.div>
          ))}
        </div>
        
        {/* Location Map Section */}
        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Location Map</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setMapType('roadmap')}
                className={`px-3 py-1 rounded-lg text-sm transition ${mapType === 'roadmap' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                Road
              </button>
              <button 
                onClick={() => setMapType('satellite')}
                className={`px-3 py-1 rounded-lg text-sm transition ${mapType === 'satellite' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                Satellite
              </button>
              <button 
                onClick={() => setMapType('terrain')}
                className={`px-3 py-1 rounded-lg text-sm transition ${mapType === 'terrain' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                Terrain
              </button>
            </div>
          </div>
          <motion.div 
            className="aspect-[16/9] rounded-xl overflow-hidden shadow-lg relative bg-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {destination?.location?.lat && destination?.location?.lng ? (
              <>
                <img 
                  src={`${API_BASE_URL}/maps/static?center=${destination.location.lat},${destination.location.lng}&zoom=12&size=1200x675&maptype=${mapType}&markers=color:red|${destination.location.lat},${destination.location.lng}&timestamp=${Date.now()}`}
                  alt={`Map of ${destination.name}`}
                  className="w-full h-full object-cover"
                  onLoad={() => setMapLoaded(true)}
                  onError={(e) => {
                    console.error('Map load error');
                    e.target.src = '/placeholder-map.svg';
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm">
                    <strong>{destination.name}</strong> {mapLoaded ? `· ${destination.location.lat.toFixed(4)}, ${destination.location.lng.toFixed(4)}` : ''}
                  </p>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-400">Map not available for this location</p>
              </div>
            )}
            {!mapLoaded && destination?.location?.lat && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </motion.div>
          <div className="mt-3 bg-gray-900/50 p-3 rounded-lg backdrop-blur-sm">
            <p className="text-gray-300 text-sm">
              <strong>About this location:</strong> {destination.description?.substring(0, 180)}
              {destination.description?.length > 180 ? '...' : ''}
            </p>
            {destination?.details?.address && (
              <p className="text-gray-400 text-xs mt-1">{destination.details.address}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tab.Group onChange={setActiveSection}>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-900/20 p-1 backdrop-blur-sm overflow-x-auto">
            {['overview', 'attractions', 'hotels', 'restaurants', 'travelTips', 'visitorInfo', 'culture', 'itinerary', 'accessibility'].map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  `whitespace-nowrap rounded-lg py-2.5 px-3 text-sm font-medium leading-5
                   ${selected
                    ? 'bg-white/[0.12] text-white shadow'
                    : 'text-gray-400 hover:bg-white/[0.12] hover:text-white'
                  }`
                }
              >
                {tab === 'visitorInfo' ? 'Visitor Info' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-6">
            {['overview', 'attractions', 'hotels', 'restaurants', 'travelTips', 'visitorInfo', 'culture', 'itinerary', 'accessibility'].map((section) => (
              <Tab.Panel key={section} className="rounded-xl p-3">
                {section === 'visitorInfo' ? renderVisitorInfoSection() : renderSection(section)}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              src={getImageUrl(selectedImage, 'modal')}
              alt={selectedImage.alt}
              className="max-h-[90vh] max-w-full object-contain"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onError={(e) => {
                console.log('Modal image error');
                handleImageError('modal');
                e.target.src = getMapFallbackImage("1200x800", "satellite");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DestinationDetails; 