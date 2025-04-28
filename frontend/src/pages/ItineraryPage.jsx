import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../config";

const ItineraryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    destination: "",
    days: 3
  });
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generalTips, setGeneralTips] = useState([]);

  // Check if there's state passed from the DestinationDetails page
  useEffect(() => {
    if (location.state?.itinerary && location.state?.destinationName) {
      setItinerary(location.state.itinerary);
      setFormData(prev => ({
        ...prev,
        destination: location.state.destinationName
      }));
      if (location.state.generalTips) {
        setGeneralTips(location.state.generalTips);
      }
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "days" ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/generate-itinerary`, formData);
      setItinerary(response.data.itinerary.days);
      setGeneralTips(response.data.itinerary.generalTips || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate itinerary");
    } finally {
      setLoading(false);
    }
  };

  const renderActivityIcon = (activity) => {
    const activityText = activity.activity.toLowerCase();
    
    if (activityText.includes('visit') || activityText.includes('explore')) {
      return '🏛️';
    } else if (activityText.includes('lunch') || activityText.includes('breakfast')) {
      return '🍽️';
    } else if (activityText.includes('dinner')) {
      return '🍷';
    } else if (activityText.includes('shop')) {
      return '🛍️';
    } else if (activityText.includes('relax') || activityText.includes('rest')) {
      return '😌';
    } else if (activityText.includes('hike') || activityText.includes('walk')) {
      return '🥾';
    } else if (activityText.includes('beach')) {
      return '🏖️';
    } else if (activityText.includes('museum')) {
      return '🖼️';
    } else {
      return '📍';
    }
  };

  return (
    <div className="bg-black text-white min-h-screen px-6 md:px-20 py-10">
      <h1 className="text-4xl md:text-5xl font-bold text-center">
        ✈️ Your Travel Itinerary
      </h1>
      <p className="text-gray-400 text-center mt-2">
        {itinerary 
          ? `Your ${itinerary.length}-day itinerary for ${formData.destination}`
          : "Create your custom AI-powered travel plan!"
        }
      </p>

      {!itinerary && (
        <div className="max-w-2xl mx-auto mt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-300 mb-2">Destination</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="Enter your destination"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Number of Days</label>
              <input
                type="number"
                name="days"
                value={formData.days}
                onChange={handleChange}
                min="1"
                max="14"
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  <span>Generating...</span>
                </div>
              ) : "Generate Itinerary"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-900/50 text-red-200 rounded-lg">
              {error}
            </div>
          )}
        </div>
      )}

      {itinerary && (
        <div className="max-w-4xl mx-auto mt-8">
          {/* General Tips Section */}
          {generalTips.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 p-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-lg shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-4">General Travel Tips</h2>
              <ul className="list-disc list-inside space-y-2">
                {generalTips.map((tip, index) => (
                  <li key={index} className="text-gray-200">
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
          
          {/* Itinerary Days */}
          <div className="space-y-8">
            {itinerary.map((day, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-lg shadow-lg"
              >
                <h2 className="text-3xl font-bold mb-4">Day {day.day} - {formData.destination}</h2>
                <div className="mt-4 space-y-4">
                  {day.activities.map((activity, actIndex) => (
                    <motion.div 
                      key={actIndex}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-800/50 p-5 rounded-lg"
                    >
                      <div className="flex items-start">
                        <div className="text-2xl mr-4">{renderActivityIcon(activity)}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="text-xl font-semibold text-white">{activity.activity}</h3>
                            <span className="text-gray-400 text-sm ml-2">{activity.time}</span>
                          </div>
                          <p className="text-gray-300 mt-2">{activity.description}</p>
                          {activity.tips && (
                            <div className="mt-3 text-sm text-yellow-300">
                              <span className="font-semibold">Tip:</span> {activity.tips}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Generate New Itinerary Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setItinerary(null);
                setGeneralTips([]);
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-200"
            >
              Generate Another Itinerary
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 text-center">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-full font-semibold shadow-lg transition-all duration-200"
        >
          ← Back
        </button>
      </div>
    </div>
  );
};

export default ItineraryPage;