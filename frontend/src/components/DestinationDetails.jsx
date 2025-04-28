import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Star, Clock, Phone, Globe, Navigation } from 'lucide-react';

const DestinationDetails = () => {
  const { name } = useParams();
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDestination = async () => {
      try {
        const response = await axios.get(`/api/locations/details/${encodeURIComponent(name)}`);
        setDestination(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDestination();
  }, [name]);

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!destination) return <div className="text-center">No destination found</div>;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'photos', label: 'Photos' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'nearby', label: 'Nearby Places' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative h-96 rounded-xl overflow-hidden mb-8">
        {destination.photos && destination.photos[0] && (
          <img
            src={destination.photos[0].url}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-8">
          <h1 className="text-4xl font-bold text-white mb-2">{destination.name}</h1>
          {destination.details && (
            <div className="flex items-center text-white space-x-4">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{destination.details.address}</span>
              </div>
              {destination.details.rating && (
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-400" />
                  <span>{destination.details.rating} ({destination.details.reviewCount} reviews)</span>
                </div>
              )}
            </div>
          )}
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
              {destination.details && (
                <>
                  <div className="prose max-w-none">
                    <h2 className="text-2xl font-bold mb-4">About</h2>
                    <p>{destination.details.description || 'No description available.'}</p>
                  </div>

                  {destination.details.openingHours && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Opening Hours</h3>
                      <div className="space-y-2">
                        {destination.details.openingHours.map((hours, index) => (
                          <div key={index} className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{hours}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(destination.details.phone || destination.details.website) && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Contact Information</h3>
                      {destination.details.phone && (
                        <div className="flex items-center mb-2">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <a href={`tel:${destination.details.phone}`} className="text-blue-600 hover:underline">
                            {destination.details.phone}
                          </a>
                        </div>
                      )}
                      {destination.details.website && (
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-2 text-gray-400" />
                          <a href={destination.details.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {destination.photos?.map((photo, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden">
                  <img src={photo.url} alt={`${destination.name} - Photo ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {destination.details?.reviews?.map((review, index) => (
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

          {activeTab === 'nearby' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {destination.nearby?.map((place, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start">
                    {place.photos && place.photos[0] && (
                      <img src={place.photos[0].thumbnail} alt={place.name} className="w-20 h-20 rounded object-cover mr-4" />
                    )}
                    <div>
                      <h4 className="font-medium mb-1">{place.name}</h4>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Navigation className="w-4 h-4 mr-1" />
                        <span>{place.distance}m away</span>
                      </div>
                      {place.rating && (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span>{place.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-1">
          {destination.details?.weather && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Current Weather</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{destination.details.weather.temperature}°C</div>
                  <div className="text-gray-500">{destination.details.weather.description}</div>
                </div>
                {destination.details.weather.icon && (
                  <img
                    src={destination.details.weather.icon}
                    alt="Weather icon"
                    className="w-16 h-16"
                  />
                )}
              </div>
            </div>
          )}

          {destination.details?.popularTimes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Popular Times</h3>
              <div className="space-y-4">
                {Object.entries(destination.details.popularTimes).map(([day, times]) => (
                  <div key={day}>
                    <h4 className="font-medium mb-2">{day}</h4>
                    <div className="h-24 flex items-end space-x-1">
                      {times.map((popularity, hour) => (
                        <div
                          key={hour}
                          className="flex-1 bg-blue-100 rounded-t"
                          style={{ height: `${popularity}%` }}
                          title={`${hour}:00 - ${popularity}% busy`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DestinationDetails; 