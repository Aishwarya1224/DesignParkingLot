/**
 * Public API barrel — re-exports everything a consumer needs.
 */
const ParkingLot    = require('./core/ParkingLot');
const Vehicle       = require('./models/Vehicle');
const VehicleType   = require('./models/VehicleType');
const SpotSize      = require('./models/SpotSize');
const FeeCalculator = require('./services/FeeCalculator');
const SpotAllocator = require('./services/SpotAllocator');
const TicketManager = require('./services/TicketManager');

module.exports = {
  ParkingLot,
  Vehicle,
  VehicleType,
  SpotSize,
  FeeCalculator,
  SpotAllocator,
  TicketManager,
};
