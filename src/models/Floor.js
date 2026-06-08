/**
 * Floor Model
 * Represents a single floor in the parking lot.
 * Holds a collection of ParkingSpots and exposes availability queries.
 */
const ParkingSpot = require('./ParkingSpot');
const SpotSize    = require('./SpotSize');

class Floor {
  /**
   * @param {number} floorNumber
   * @param {Object} spotConfig  - { SMALL: n, MEDIUM: n, LARGE: n }
   */
  constructor(floorNumber, spotConfig = { SMALL: 20, MEDIUM: 30, LARGE: 10 }) {
    this.floorNumber = floorNumber;
    this.spots       = [];         // ordered list of all spots on this floor
    this._buildSpots(spotConfig);
  }

  _buildSpots(spotConfig) {
    let index = 1;
    for (const [size, count] of Object.entries(spotConfig)) {
      if (!Object.values(SpotSize).includes(size)) continue;
      for (let i = 0; i < count; i++) {
        const spotId = `F${this.floorNumber}-${size[0]}${String(index).padStart(3, '0')}`;
        this.spots.push(new ParkingSpot(spotId, this.floorNumber, index, size));
        index++;
      }
    }
  }

  /**
   * Get all available spots of a specific size on this floor.
   * @param {SpotSize} size
   * @returns {ParkingSpot[]}
   */
  getAvailableSpotsBySize(size) {
    return this.spots.filter(s => s.size === size && s.isAvailable());
  }

  /**
   * Summary of availability per size category.
   */
  getAvailabilitySummary() {
    const summary = {};
    for (const size of Object.values(SpotSize)) {
      const total     = this.spots.filter(s => s.size === size).length;
      const available = this.spots.filter(s => s.size === size && s.isAvailable()).length;
      summary[size]   = { total, available, occupied: total - available };
    }
    return summary;
  }

  toString() {
    const summary = this.getAvailabilitySummary();
    const parts = Object.entries(summary).map(
      ([size, { total, available }]) => `${size}: ${available}/${total}`
    );
    return `Floor ${this.floorNumber} [${parts.join(' | ')}]`;
  }
}

module.exports = Floor;
