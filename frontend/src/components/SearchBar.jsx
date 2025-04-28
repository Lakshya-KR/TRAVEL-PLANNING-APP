import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { API_BASE_URL, MAPS_CONFIG } from '../config';

const SearchBar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!searchTerm || searchTerm.length < 3) {
      setSearchResults([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/locations/search?q=${encodeURIComponent(searchTerm)}`);
        console.log('Search results:', response.data.results);
        setSearchResults(response.data.results || []);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search. Please try again.');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchResults([]);
      setSearchTerm('');
    }
  };

  const handleResultClick = (result) => {
    // Extract just the main part of the name, before any commas
    const destinationName = result.name.split(',')[0].trim();
    
    // If this is a city, use the correct URL format
    if (result.place_type === 'city') {
      navigate(`/destination/${encodeURIComponent(destinationName)}`);
    } else {
      // For tourist attractions or specific places
      navigate(`/destination/${encodeURIComponent(destinationName)}`);
    }
    
    setSearchResults([]);
    setSearchTerm('');
  };

  // Get an appropriate image URL for each search result
  const getResultImageUrl = (result) => {
    // FIXED: Use the MAPS_CONFIG helper directly which properly handles all the cases
    return MAPS_CONFIG.getPlaceImageUrl(result);
  };

  // Get a more descriptive label for the result type
  const getResultTypeLabel = (result) => {
    if (!result || !result.types) return 'Destination';
    
    if (result.place_type === 'city') {
      return 'City';
    }
    
    if (result.types.includes('country')) {
      return 'Country';
    }
    
    if (result.types.includes('administrative_area_level_1')) {
      return 'State/Province';
    }
    
    if (result.types.includes('locality')) {
      return 'City';
    }
    
    if (result.types.includes('tourist_attraction')) {
      return 'Tourist Attraction';
    }
    
    if (result.types.includes('point_of_interest')) {
      return 'Point of Interest';
    }
    
    return result.place_type || 'Destination';
  };

  return (
    <div className="relative z-10" ref={searchRef}>
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search destinations..."
          className="w-full py-3 px-4 pl-12 rounded-full bg-gray-800/90 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent backdrop-blur-sm"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <svg className="animate-spin h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </form>

      {searchResults.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-xl bg-gray-900/90 backdrop-blur-md border border-gray-800 shadow-2xl"
        >
          <ul className="py-2">
            {searchResults.map((result, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="px-4 py-3 hover:bg-gray-800/60 cursor-pointer"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={getResultImageUrl(result)} 
                      alt={result.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error(`Failed to load image for ${result.name}`, e);
                        e.target.src = '/placeholder-map.svg';
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{result.name}</div>
                    <div className="text-sm text-gray-400">
                      {getResultTypeLabel(result)}
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-900/80 text-white rounded-lg backdrop-blur-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 