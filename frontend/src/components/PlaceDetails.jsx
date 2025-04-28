import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Star, Clock, Phone, Globe, Navigation, Wind, Droplet, Thermometer } from 'lucide-react';

const PlaceDetails = () => {
  const { placeId } = useParams();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        const response = await axios.get(`/api/places/details/${placeId}`);
        setPlace(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [placeId]);

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!place) return <div className="text-center">No place found</div>;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'photos', label: 'Photos' },
    { id: 'reviews', label: 'Reviews' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative h-96 rounded-xl overflow-hidden mb-8">
        {place.photos && place.photos[0] && (
          <img
            src={place.photos[0].url}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-8">
          <h1 className="text-4xl font-bold text-white mb-2">{place.name}</h1>
          <div className="flex items-center text-white space-x-4">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{place.address}</span>
            </div>
            {place.rating && (
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1 text-yellow-400" />
                <span>{place.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <p>{place.description || 'No description available.'}</p>
              </div>

              {place.openingHours && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Opening Hours</h3>
                  <div className="space-y-2">
                    {place.openingHours.map((hours, index) => (
                      <div key={index} className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(place.phone || place.website) && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">Contact Information</h3>
                  {place.phone && (
                    <div className="flex items-center mb-2">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <a href={`tel:${place.phone}`} className="text-blue-600 hover:underline">
                        {place.phone}
                      </a>
                    </div>
                  )}
                  {place.website && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-gray-400" />
                      <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {place.photos?.map((photo, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden">
                  <img src={photo.url} alt={`${place.name} - Photo ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {place.reviews?.map((review, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-center mb-2">
                    <img src={review.authorPhoto} alt={review.authorName} className="w-10 h-10 rounded-full mr-3" />
                    <div>
                      <h4 className="font-medium">{review.authorName}</h4>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-gray-600">{review.rating}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700">{review.text}</p>
                  <span className="text-sm text-gray-500">{review.relativeTime}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-1">
          {place.weather && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Current Weather</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{place.weather.temperature}°C</div>
                  <div className="text-gray-500">{place.weather.description}</div>
                </div>
                {place.weather.icon && (
                  <img
                    src={place.weather.icon}
                    alt="Weather icon"
                    className="w-16 h-16"
                  />
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Wind className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{place.weather.windSpeed} m/s</span>
                </div>
                <div className="flex items-center">
                  <Droplet className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{place.weather.humidity}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaceDetails; 