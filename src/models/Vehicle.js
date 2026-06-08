/**
 * Vehicle Model
 * Represents a vehicle entering or exiting the parking lot.
 */
const VehicleType = require('./VehicleType');

class Vehicle {
  /**
   * @param {string} licensePlate - Unique identifier for the vehicle
   * @param {VehicleType} vehicleType - Type of the vehicle
   */
  constructor(licensePlate, vehicleType) {
    if (!Object.values(VehicleType).includes(vehicleType)) {
      throw new Error(`Invalid vehicle type: ${vehicleType}`);
    }
    if (!licensePlate || typeof licensePlate !== 'string') {
      throw new Error('License plate must be a non-empty string');
    }
    this.licensePlate = licensePlate.toUpperCase().trim();
    this.vehicleType = vehicleType;
  }

  toString() {
    return `Vehicle[${this.vehicleType} | ${this.licensePlate}]`;
  }
}

module.exports = Vehicle;
