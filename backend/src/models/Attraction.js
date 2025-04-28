class Attraction {
  constructor(data, city) {
    this.name = data.name;
    this.categories = data.kinds.split(',');
    this.distance = Math.round(data.dist * 1000);
    this.rating = data.rate;
    this.description = data.wikipedia_extracts?.text || data.info?.descr || null;
    this.image = data.preview?.source || data.image || null;
    this.address = data.address?.road 
      ? `${data.address.road}${data.address.house_number ? ` ${data.address.house_number}` : ''}, ${city}`
      : null;
    this.website = data.url || data.website || null;
    this.point = {
      lat: data.point.lat,
      lon: data.point.lon
    };
  }

  static fromOpenTripMap(data, city) {
    return new Attraction(data, city);
  }
}

module.exports = Attraction;