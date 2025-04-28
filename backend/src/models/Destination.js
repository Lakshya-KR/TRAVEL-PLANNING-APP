const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  url: String,
  thumbnail: String,
  reference: String,
  width: Number,
  height: Number,
  attribution: String
});

const reviewSchema = new mongoose.Schema({
  author: String,
  rating: Number,
  text: String,
  time: Date,
  authorUrl: String
});

const placeSchema = new mongoose.Schema({
  name: String,
  place_id: String,
  location: {
    lat: Number,
    lng: Number
  },
  rating: Number,
  photos: [photoSchema],
  price_level: Number,
  types: [String]
});

const destinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    overview: String,
    attractions: [{
      name: String,
      description: String,
      rating: Number
    }],
    hotels: [{
      name: String,
      description: String,
      priceRange: String,
      rating: Number
    }],
    restaurants: [{
      name: String,
      description: String,
      cuisine: String,
      rating: Number
    }],
    travelTips: [String],
    bestTimeToVisit: String,
    localCulture: String
  },
  photos: [photoSchema],
  details: {
    name: String,
    address: String,
    phone: String,
    rating: Number,
    website: String,
    url: String,
    priceLevel: Number,
    photos: [photoSchema],
    reviews: [reviewSchema],
    openingHours: [String],
    nearby: {
      attractions: [placeSchema],
      hotels: [placeSchema],
      restaurants: [placeSchema]
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Method to check if the data is stale (older than 7 days)
destinationSchema.methods.isStale = function() {
  const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  return Date.now() - this.lastUpdated > staleThreshold;
};

const Destination = mongoose.model('Destination', destinationSchema);

module.exports = Destination;