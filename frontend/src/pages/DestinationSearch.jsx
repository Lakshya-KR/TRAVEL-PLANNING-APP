import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const loadingQuotes = [
  "Exploring the world, one search at a time...",
  "Finding your perfect destination...",
  "Searching for amazing places...",
  "Discovering hidden gems...",
  "Mapping your next adventure..."
];

const suggestedPlaces = [
  {
    name: "Paris, France",
    displayName: "Paris, France",
    images: [{
      url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
      alt: "Eiffel Tower in Paris",
      photographer: "Chris Karidis",
      photographer_url: "https://unsplash.com/@chriskaridis"
    }],
    details: {
      city: "Paris",
      country: "France",
      type: "city"
    }
  },
  {
    name: "Bali, Indonesia",
    displayName: "Bali, Indonesia",
    images: [{
      url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
      alt: "Temple in Bali",
      photographer: "Artem Bali",
      photographer_url: "https://unsplash.com/@artembali"
    }],
    details: {
      city: "Bali",
      country: "Indonesia",
      type: "region"
    }
  },
  {
    name: "New York City, USA",
    displayName: "New York City, USA",
    images: [{
      url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80",
      alt: "New York City skyline",
      photographer: "Roberto Nickson",
      photographer_url: "https://unsplash.com/@rpnickson"
    }],
    details: {
      city: "New York",
      country: "USA",
      type: "city"
    }
  }
];

const DestinationSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showLoadingQuote, setShowLoadingQuote] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length >= 3) {
      setShowLoadingQuote(true);
      if (typingTimeout) clearTimeout(typingTimeout);
      
      const timeout = setTimeout(() => {
        handleSearch();
      }, 1000);
      
      setTypingTimeout(timeout);
    } else {
      setShowLoadingQuote(false);
      setResults([]);
      setMessage('');
    }

    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [query]);

  const handleSearch = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await axios.get(`http://localhost:5000/api/locations/search?q=${encodeURIComponent(query)}`);
      console.log('Search response:', response.data);

      if (response.data.error) {
        setError(response.data.error);
        setResults([]);
      } else if (response.data.results.length === 0) {
        setMessage(response.data.message || 'No results found. Try a different search term.');
        setResults([]);
      } else {
        setResults(response.data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.response?.data?.message || 'Failed to search destinations');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoHover = (e) => {
    const video = e.target;
    video.play().catch(error => {
      console.error('Video play error:', error);
    });
  };

  const handleVideoLeave = (e) => {
    const video = e.target;
    video.pause();
    video.currentTime = 0;
  };

  const handleDestinationClick = async (destination) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/destination/${encodeURIComponent(destination.name)}`);
      console.log('Destination details response:', response.data);
      navigate(`/destination/${encodeURIComponent(destination.name)}`);
    } catch (err) {
      console.error('Error fetching destination details:', err);
      setError('Failed to fetch destination details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const SearchResultCard = ({ result, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const videoRef = useRef(null);

    const fallbackImage = "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1200&q=80";

    useEffect(() => {
      if (videoRef.current) {
        if (isHovered) {
          videoRef.current.play().catch(error => console.log('Video autoplay failed:', error));
        } else {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }
    }, [isHovered]);

    const handleImageError = (e) => {
      console.log('Image failed to load:', e);
      setImageError(true);
      e.target.src = fallbackImage;
      setImageLoaded(true);
    };

    const imageUrl = result.images?.[0]?.url || fallbackImage;

    return (
      <motion.div
        className="relative group cursor-pointer bg-gray-800 rounded-lg"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative h-48 rounded-lg overflow-hidden">
          {/* Loading Skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-700 animate-pulse">
              <div className="h-full w-full flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
          )}

          {/* Background Image */}
          <img
            src={imageUrl}
            alt={result.images?.[0]?.alt || result.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
          />
          
          {/* Video Overlay */}
          {result.videos?.[0]?.url && (
            <div className={`absolute inset-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <video
                ref={videoRef}
                src={result.videos[0].url}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                poster={result.videos[0].thumbnail}
              />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white text-lg font-semibold">{result.name}</h3>
            <p className="text-white/80 text-sm">
              {result.details?.city}, {result.details?.country}
            </p>
            {!imageError && result.images?.[0]?.photographer && (
              <p className="text-white/60 text-xs mt-1">
                Photo by{' '}
                <a
                  href={result.images[0].photographer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white/80 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {result.images[0].photographer}
                </a>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/50 via-black to-gray-900/50" />
      
      {/* Content */}
      <div className="relative z-10 px-4 py-8 md:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-white mb-4">
              Discover Your Next Adventure
            </h1>
            <p className="text-gray-400 text-lg md:text-xl mb-8">
              Explore destinations around the world and find your perfect getaway
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleSearch}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a destination..."
                className="w-full px-6 py-4 rounded-2xl bg-gray-900/80 text-white placeholder-gray-500 border border-gray-800 focus:border-gray-700 focus:ring-2 focus:ring-gray-700 focus:outline-none transition-all duration-300 backdrop-blur-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 px-6 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </motion.form>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto mb-8 p-4 bg-gray-900/80 border border-gray-800 rounded-xl text-red-400 backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto mb-8 p-4 bg-gray-900/80 border border-gray-800 rounded-xl text-gray-300 backdrop-blur-sm"
            >
              {message}
            </motion.div>
          )}

          {loading && showLoadingQuote && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-400 mb-8"
            >
              {loadingQuotes[Math.floor(Math.random() * loadingQuotes.length)]}
            </motion.div>
          )}

          {results.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {results.map((result, index) => (
                <SearchResultCard
                  key={index}
                  result={result}
                  onClick={() => handleDestinationClick(result)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-bold text-gray-300 mb-6">Popular Destinations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedPlaces.map((place, index) => (
                  <SearchResultCard
                    key={index}
                    result={place}
                    onClick={() => handleDestinationClick(place)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DestinationSearch;
