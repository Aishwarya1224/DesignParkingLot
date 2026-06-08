/**
 * SpotAllocator Service
 *
 * Encapsulates the best-fit spot allocation algorithm.
 *
 * Allocation rules (smallest compatible size first to minimise waste):
 *   MOTORCYCLE → prefers SMALL, then MEDIUM, then LARGE
 *   CAR        → prefers MEDIUM, then LARGE
 *   BUS        → LARGE only
 *
 * Within a size category, spots are chosen by lowest floor → lowest spot
 * number (closest to entrance).
 */
const VehicleType = require('../models/VehicleType');
const SpotSize    = require('../models/SpotSize');

/** Priority-ordered spot sizes each vehicle type may use */
const VEHICLE_SPOT_PREFERENCES = {
  [VehicleType.MOTORCYCLE]: [SpotSize.SMALL, SpotSize.MEDIUM, SpotSize.LARGE],
  [VehicleType.CAR]:        [SpotSize.MEDIUM, SpotSize.LARGE],
  [VehicleType.BUS]:        [SpotSize.LARGE],
};

class SpotAllocator {
  /**
   * Find and return the best available spot for the given vehicle across
   * all floors, or null if none is available.
   *
   * @param {Floor[]}  floors
   * @param {Vehicle}  vehicle
   * @returns {ParkingSpot|null}
   */
  findBestSpot(floors, vehicle) {
    const preferences = VEHICLE_SPOT_PREFERENCES[vehicle.vehicleType];
    if (!preferences) {
      throw new Error(`No spot preferences configured for vehicle type: ${vehicle.vehicleType}`);
    }

    // Iterate preferred sizes in order (best fit first)
    for (const size of preferences) {
      // Iterate floors in ascending order (ground floor first)
      for (const floor of floors) {
        const availableSpots = floor.getAvailableSpotsBySize(size);
        if (availableSpots.length > 0) {
          // Pick the spot with the lowest spot number on this floor
          availableSpots.sort((a, b) => a.spotNumber - b.spotNumber);
          return availableSpots[0];
        }
      }
    }

    return null; // No compatible spot found
  }

  /**
   * Returns a structured availability report across all floors.
   * @param {Floor[]} floors
   * @returns {Object}
   */
  getAvailabilityReport(floors) {
    const report = { floors: [], totals: {} };

    for (const size of Object.values(SpotSize)) {
      report.totals[size] = { total: 0, available: 0, occupied: 0 };
    }

    for (const floor of floors) {
      const summary = floor.getAvailabilitySummary();
      report.floors.push({ floor: floor.floorNumber, summary });

      for (const [size, counts] of Object.entries(summary)) {
        report.totals[size].total     += counts.total;
        report.totals[size].available += counts.available;
        report.totals[size].occupied  += counts.occupied;
      }
    }

    return report;
  }
}

module.exports = SpotAllocator;
