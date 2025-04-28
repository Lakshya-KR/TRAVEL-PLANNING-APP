const express = require('express');
const router = express.Router();
const { searchPlaces, getPlaceDetails } = require('../services/placesService');

// Search for places
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const places = await searchPlaces(query);
    res.json(places);
  } catch (error) {
    console.error('Error in places search:', error);
    res.status(500).json({ error: 'Failed to search places' });
  }
});

// Get place details
router.get('/details/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    if (!placeId) {
      return res.status(400).json({ error: 'Place ID is required' });
    }

    const details = await getPlaceDetails(placeId);
    res.json(details);
  } catch (error) {
    console.error('Error getting place details:', error);
    res.status(500).json({ error: 'Failed to get place details' });
  }
});

module.exports = router; 