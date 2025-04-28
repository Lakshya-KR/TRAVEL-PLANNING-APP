import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';

const PlaceDetails = () => {
  const { name } = useParams();
  const [placeData, setPlaceData] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '0.5rem'
  };

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        setLoading(true);
        // Fetch place coordinates and basic info
        const placeResponse = await axios.get(`http://localhost:5000/api/places/${encodeURIComponent(name)}/details`);
        setPlaceData(placeResponse.data);
        setMapCenter({
          lat: placeResponse.data.coordinates.lat,
          lng: placeResponse.data.coordinates.lon
        });

        // Fetch attractions
        const attractionsResponse = await axios.get(`http://localhost:5000/api/places/${encodeURIComponent(name)}/attractions`);
        setAttractions(attractionsResponse.data);

        // Fetch restaurants
        const restaurantsResponse = await axios.get(`http://localhost:5000/api/places/${encodeURIComponent(name)}/restaurants`);
        setRestaurants(restaurantsResponse.data);

        // Fetch images
        const imagesResponse = await axios.get(`http://localhost:5000/api/places/${encodeURIComponent(name)}/images`);
        setImages(imagesResponse.data);

        setLoading(false);
      } catch (err) {
        setError('Failed to load place details. Please try again later.');
        setLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [name]);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading {name}'s details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-5 bg-red-50 rounded-lg mx-auto my-5 max-w-2xl">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 text-center mb-8">{name}</h1>

      {/* Image Gallery */}
      <div className="relative w-full h-[500px] mb-8 rounded-xl overflow-hidden shadow-lg">
        <button 
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-all z-10"
          onClick={handlePrevImage}
        >
          ❮
        </button>
        <img 
          src={images[currentImageIndex]?.url} 
          alt={`${name} - ${currentImageIndex + 1}`}
          className="w-full h-full object-cover"
        />
        <button 
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-all z-10"
          onClick={handleNextImage}
        >
          ❯
        </button>
        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full">
          {currentImageIndex + 1} / {images.length}
        </div>
      </div>

      {/* Place Description */}
      <div className="bg-white p-8 rounded-xl shadow-md mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">About {name}</h2>
        <p className="text-gray-600">{placeData?.description}</p>
      </div>

      {/* Things to Do Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Things to Do</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {attractions.map((attraction) => (
            <div key={attraction.id} className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:-translate-y-1">
              <img src={attraction.image} alt={attraction.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{attraction.name}</h3>
                <p className="text-gray-600 mb-4">{attraction.description}</p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-yellow-500">⭐ {attraction.rating}</span>
                  <span className="text-gray-500">📍 {attraction.distance}km away</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Explore {name}</h2>
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={13}
          >
            {attractions.map((attraction) => (
              <Marker
                key={attraction.id}
                position={{
                  lat: attraction.coordinates.lat,
                  lng: attraction.coordinates.lon
                }}
                icon={{
                  url: '/attraction-marker.png',
                  scaledSize: new window.google.maps.Size(30, 30)
                }}
                onClick={() => setSelectedMarker(attraction)}
              />
            ))}

            {restaurants.map((restaurant) => (
              <Marker
                key={restaurant.id}
                position={{
                  lat: restaurant.coordinates.lat,
                  lng: restaurant.coordinates.lon
                }}
                icon={{
                  url: '/restaurant-marker.png',
                  scaledSize: new window.google.maps.Size(30, 30)
                }}
                onClick={() => setSelectedMarker(restaurant)}
              />
            ))}

            {selectedMarker && (
              <InfoWindow
                position={{
                  lat: selectedMarker.coordinates.lat,
                  lng: selectedMarker.coordinates.lon
                }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2 max-w-xs">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{selectedMarker.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{selectedMarker.description}</p>
                  <p className="text-yellow-500">⭐ {selectedMarker.rating}</p>
                  {selectedMarker.cuisine && (
                    <p className="text-gray-600">🍽️ {selectedMarker.cuisine}</p>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Restaurants Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Popular Restaurants</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white rounded-xl shadow-md overflow-hidden transition-transform hover:-translate-y-1">
              <img src={restaurant.image} alt={restaurant.name} className="w-full h-44 object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{restaurant.name}</h3>
                <p className="text-gray-600 mb-4">{restaurant.cuisine}</p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-yellow-500">⭐ {restaurant.rating}</span>
                  <span className="text-gray-500">💰 {restaurant.priceLevel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaceDetails;