const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const { clearExpiredCache, getCacheStats, optimizeCache } = require('./services/cacheService');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Connect to MongoDB
connectDB();

// Cache cleanup job (runs every hour)
setInterval(async () => {
  try {
    await clearExpiredCache();
    console.log('Cache cleanup completed');
  } catch (error) {
    console.error('Error during cache cleanup:', error);
  }
}, 60 * 60 * 1000);

// Cache optimization job (runs every 6 hours)
setInterval(async () => {
  try {
    await optimizeCache();
    console.log('Cache optimization completed');
  } catch (error) {
    console.error('Error during cache optimization:', error);
  }
}, 6 * 60 * 60 * 1000);

// Cache monitoring endpoint
app.get('/api/cache/stats', (req, res) => {
  try {
    const stats = getCacheStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache statistics' });
  }
});

// Routes
app.use('/api/places', require('./routes/places'));
app.use('/api', require('./routes/locationRoutes'));
app.use('/api/maps', require('./routes/mapsRoutes'));
app.use('/api/accessibility', require('./routes/accessibility'));

// Map demo page for testing
app.get('/map-demo', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/map-demo.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Map demo available at: http://localhost:${PORT}/map-demo`);
}); 