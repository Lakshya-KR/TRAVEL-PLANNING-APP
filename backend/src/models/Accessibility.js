const mongoose = require('mongoose');

const medicalFacilitySchema = new mongoose.Schema({
  name: String,
  description: String,
  address: String,
  phone: String,
  website: String,
  accessibilityFeatures: String
});

const specializedTransportSchema = new mongoose.Schema({
  name: String,
  description: String,
  contact: String,
  website: String
});

const accessibilityFeatureSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: {
    type: String,
    enum: ['mobility', 'visual', 'hearing', 'cognitive', 'sensory'],
    required: true
  },
  location: String,
  hours: String
});

const accessibilitySchema = new mongoose.Schema({
  destinationName: {
    type: String,
    required: true,
    unique: true
  },
  wheelchair: {
    type: Boolean,
    default: false
  },
  accessibleTransport: {
    type: Boolean,
    default: false
  },
  accessibleAccommodations: {
    type: Boolean,
    default: false
  },
  assistiveServices: {
    type: Boolean,
    default: false
  },
  sensoryAccommodations: {
    type: Boolean, 
    default: false
  },
  notes: String,
  transportNotes: String,
  transportOptions: [String],
  specializedTransport: [specializedTransportSchema],
  detailedFeatures: [accessibilityFeatureSchema],
  emergencyNumber: String,
  medicalEmergencyNumber: String,
  medicalFacilities: [medicalFacilitySchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Method to check if the data is stale (older than 30 days)
accessibilitySchema.methods.isStale = function() {
  const staleThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
  return Date.now() - this.lastUpdated > staleThreshold;
};

const Accessibility = mongoose.model('Accessibility', accessibilitySchema);

module.exports = Accessibility; 