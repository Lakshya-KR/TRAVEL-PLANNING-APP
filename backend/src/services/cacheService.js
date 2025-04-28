const Cache = require('../models/Cache');

const CACHE_DURATIONS = {
  place_details: 24 * 60 * 60 * 1000, // 24 hours
  search_results: 6 * 60 * 60 * 1000, // 6 hours
  photos: 7 * 24 * 60 * 60 * 1000, // 7 days
  nearby_places: 12 * 60 * 60 * 1000, // 12 hours
  weather: 30 * 60 * 1000, // 30 minutes
  popular_times: 6 * 60 * 60 * 1000 // 6 hours
};

// Cache statistics
const cacheStats = {
  hits: 0,
  misses: 0,
  totalRequests: 0,
  lastReset: new Date()
};

const generateCacheKey = (type, identifier) => {
  return `${type}:${identifier}`;
};

const getFromCache = async (type, identifier) => {
  try {
    cacheStats.totalRequests++;
    const key = generateCacheKey(type, identifier);
    const cachedData = await Cache.findOne({ key });
    
    if (cachedData && cachedData.expiresAt > new Date()) {
      cacheStats.hits++;
      return cachedData.data;
    }
    
    cacheStats.misses++;
    return null;
  } catch (error) {
    console.error('Error getting from cache:', error);
    return null;
  }
};

const setInCache = async (type, identifier, data) => {
  try {
    const key = generateCacheKey(type, identifier);
    const expiresAt = new Date(Date.now() + CACHE_DURATIONS[type]);
    
    await Cache.findOneAndUpdate(
      { key },
      {
        key,
        data,
        type,
        expiresAt,
        lastAccessed: new Date()
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error setting in cache:', error);
  }
};

const clearCache = async (type, identifier) => {
  try {
    const key = generateCacheKey(type, identifier);
    await Cache.deleteOne({ key });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

const clearExpiredCache = async () => {
  try {
    await Cache.deleteMany({ expiresAt: { $lt: new Date() } });
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
};

const getCacheStats = () => {
  const hitRate = cacheStats.totalRequests > 0 
    ? (cacheStats.hits / cacheStats.totalRequests * 100).toFixed(2) 
    : 0;
  
  return {
    ...cacheStats,
    hitRate: `${hitRate}%`,
    uptime: Math.floor((new Date() - cacheStats.lastReset) / 1000 / 60) // in minutes
  };
};

const resetCacheStats = () => {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.totalRequests = 0;
  cacheStats.lastReset = new Date();
};

const getCacheSize = async () => {
  try {
    const stats = await Cache.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalSize: { $sum: { $bsonSize: '$data' } }
        }
      }
    ]);
    
    return stats;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return [];
  }
};

const optimizeCache = async () => {
  try {
    // Remove least recently accessed items if cache is too large
    const cacheSize = await getCacheSize();
    const totalSize = cacheSize.reduce((sum, type) => sum + type.totalSize, 0);
    
    if (totalSize > 100 * 1024 * 1024) { // 100MB limit
      // Remove 20% of least recently accessed items
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
      await Cache.deleteMany({ lastAccessed: { $lt: cutoffDate } });
    }
  } catch (error) {
    console.error('Error optimizing cache:', error);
  }
};

module.exports = {
  getFromCache,
  setInCache,
  clearCache,
  clearExpiredCache,
  getCacheStats,
  resetCacheStats,
  getCacheSize,
  optimizeCache
}; 