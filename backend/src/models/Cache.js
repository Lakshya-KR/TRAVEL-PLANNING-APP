const mongoose = require('mongoose');

const cacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['place_details', 'search_results', 'photos', 'nearby_places', 'weather', 'popular_times'],
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
    index: true
  },
  accessCount: {
    type: Number,
    default: 0,
    index: true
  }
});

// Create TTL index for automatic cleanup of expired documents
cacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for optimization queries
cacheSchema.index({ type: 1, lastAccessed: 1 });
cacheSchema.index({ type: 1, accessCount: 1 });

const Cache = mongoose.model('Cache', cacheSchema);

module.exports = Cache; 