const express = require('express');
const router = express.Router();
const {
  searchDestinations,
  getDestinationDetails,
  generateItinerary
} = require('../controllers/locationController');

// Middleware to decode URL parameters
router.use('/destination/:name', (req, res, next) => {
  try {
    req.params.name = decodeURIComponent(req.params.name);
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid URL encoding' });
  }
});

// Search locations
router.get('/locations/search', searchDestinations);

// Get destination details
router.get('/destination/:name', getDestinationDetails);

// Generate itinerary
router.post('/generate-itinerary', generateItinerary);

module.exports = router;