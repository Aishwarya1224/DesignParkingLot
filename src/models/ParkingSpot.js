/**
 * ParkingSpot Model
 * Represents a single parking space on a floor.
 */
const SpotSize = require('./SpotSize');

class ParkingSpot {
  /**
   * @param {string}   spotId      - Unique identifier (e.g. "F1-S001")
   * @param {number}   floor       - Floor number (1-based)
   * @param {number}   spotNumber  - Spot index within the floor (1-based)
   * @param {SpotSize} size        - Physical size of the spot
   */
  constructor(spotId, floor, spotNumber, size) {
    if (!Object.values(SpotSize).includes(size)) {
      throw new Error(`Invalid spot size: ${size}`);
    }
    this.spotId     = spotId;
    this.floor      = floor;
    this.spotNumber = spotNumber;
    this.size       = size;
    this.isOccupied = false;
    this.vehicle    = null; // currently parked Vehicle, or null
  }

  /** @returns {boolean} Whether the spot is available */
  isAvailable() {
    return !this.isOccupied;
  }

  /**
   * Park a vehicle into this spot.
   * @param {Vehicle} vehicle
   */
  park(vehicle) {
    if (this.isOccupied) {
      throw new Error(`Spot ${this.spotId} is already occupied`);
    }
    this.vehicle    = vehicle;
    this.isOccupied = true;
  }

  /**
   * Remove the currently parked vehicle.
   */
  vacate() {
    if (!this.isOccupied) {
      throw new Error(`Spot ${this.spotId} is already vacant`);
    }
    this.vehicle    = null;
    this.isOccupied = false;
  }

  toString() {
    return `ParkingSpot[${this.spotId} | ${this.size} | ${this.isOccupied ? 'OCCUPIED' : 'FREE'}]`;
  }
}

module.exports = ParkingSpot;
