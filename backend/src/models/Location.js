class Location {
  constructor(data) {
    this.name = data.display_name;
    this.type = data.type;
    this.latitude = data.lat;
    this.longitude = data.lon;
    this.importance = data.importance;
    this.address = {
      city: data.address?.city || data.address?.town || data.address?.village,
      state: data.address?.state,
      country: data.address?.country
    };
  }

  static fromNominatim(data) {
    return new Location(data);
  }
}

module.exports = Location; 