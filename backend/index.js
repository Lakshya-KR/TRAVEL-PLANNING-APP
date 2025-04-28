require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const locationRoutes = require('./src/routes/locationRoutes');
const placesRoutes = require('./src/routes/places');
const mapsRoutes = require('./src/routes/mapsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', locationRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/maps', mapsRoutes);

// Map demo page for testing
app.get('/map-demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/map-demo.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: err.message
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Map demo available at: http://localhost:${PORT}/map-demo`);
});

