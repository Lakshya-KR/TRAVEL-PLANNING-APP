const axios = require('axios');
const Attraction = require('../models/Attraction');

class AttractionService {
  constructor() {
    this.baseUrl = 'https://opentripmap-places-v1.p.rapidapi.com/en/places';
  }

  async getAttractions(location, categories) {
    try {
      const attractionsPromises = categories.map(async ({ kind, radius, limit, name }, index) => {
        await this.delay(index * 1000);
        
        try {
          const response = await axios.get(`${this.baseUrl}/radius`, {
            params: {
              radius,
              lon: location.longitude,
              lat: location.latitude,
              kinds: kind,
              rate: '2h',
              format: 'json',
              limit: limit * 2
            },
            headers: {
              'X-RapidAPI-Key': process.env.OPENTRIPMAP_KEY,
              'X-RapidAPI-Host': 'opentripmap-places-v1.p.rapidapi.com'
            }
          });

          if (!response.data || response.data.length === 0) {
            return [];
          }

          const detailedPlaces = await Promise.all(
            response.data
              .filter(place => place.name && place.rate >= 1 && place.dist <= radius)
              .slice(0, limit)
              .map(async (place, placeIndex) => {
                await this.delay(placeIndex * 500);
                return this.getPlaceDetails(place.xid, location.address.city);
              })
          );

          return detailedPlaces.filter(place => place !== null);
        } catch (error) {
          console.error(`Error fetching ${name}:`, error);
          return [];
        }
      });

      const results = await Promise.all(attractionsPromises);
      return results.flat();
    } catch (error) {
      console.error('Error getting attractions:', error);
      throw error;
    }
  }

  async getPlaceDetails(xid, city) {
    try {
      const response = await axios.get(`${this.baseUrl}/xid/${xid}`, {
        headers: {
          'X-RapidAPI-Key': process.env.OPENTRIPMAP_KEY,
          'X-RapidAPI-Host': 'opentripmap-places-v1.p.rapidapi.com'
        }
      });

      return Attraction.fromOpenTripMap(response.data, city);
    } catch (error) {
      console.error(`Error fetching place details:`, error);
      return null;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AttractionService(); 