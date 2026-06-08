/**
 * ParkingLot (Singleton)
 *
 * The central orchestrator for the parking lot system.
 * Coordinates spot allocation, ticket management, and fee calculation.
 *
 * Thread-safety (async concurrency):
 *   checkIn and checkOut are protected by a Mutex so that concurrent
 *   requests cannot race on spot allocation or ticket state.
 */
const Floor         = require('../models/Floor');
const Mutex         = require('../utils/Mutex');
const SpotAllocator = require('../services/SpotAllocator');
const FeeCalculator = require('../services/FeeCalculator');
const TicketManager = require('../services/TicketManager');

class ParkingLot {
  /**
   * @param {string} name
   * @param {Object[]} floorConfigs  - Array of { spotConfig } per floor
   *   spotConfig example: { SMALL: 20, MEDIUM: 30, LARGE: 10 }
   * @param {Object} [feeConfig]     - Optional fee overrides for FeeCalculator
   */
  constructor(name, floorConfigs, feeConfig = {}) {
    if (ParkingLot._instance) {
      return ParkingLot._instance;
    }

    this.name          = name;
    this.floors        = floorConfigs.map(
      (cfg, i) => new Floor(i + 1, cfg.spotConfig)
    );
    this.allocator     = new SpotAllocator();
    this.feeCalculator = new FeeCalculator(feeConfig);
    this.ticketManager = new TicketManager();
    this._mutex        = new Mutex();

    ParkingLot._instance = this;
  }

  /** Destroy the singleton — useful for testing. */
  static reset() {
    ParkingLot._instance = null;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Check-in: allocate a spot and issue a ticket.
   *
   * @param {Vehicle} vehicle
   * @returns {Promise<{ ticket: ParkingTicket, spot: ParkingSpot }>}
   * @throws If the lot is full for the vehicle type
   */
  async checkIn(vehicle) {
    return this._mutex.runExclusive(() => {
      // 1. Find the best available spot
      const spot = this.allocator.findBestSpot(this.floors, vehicle);
      if (!spot) {
        throw new Error(
          `Parking lot is full for vehicle type: ${vehicle.vehicleType}`
        );
      }

      // 2. Occupy the spot
      spot.park(vehicle);

      // 3. Issue a ticket
      const ticket = this.ticketManager.createTicket(vehicle, spot);

      console.log(`[CHECK-IN]  ${vehicle} → ${spot.spotId}  | Ticket: ${ticket.ticketId}`);
      return { ticket, spot };
    });
  }

  /**
   * Check-out: calculate fee, free the spot, and close the ticket.
   *
   * @param {string} licensePlate
   * @returns {Promise<{ ticket: ParkingTicket, fee: number }>}
   * @throws If no active ticket exists for the plate
   */
  async checkOut(licensePlate) {
    return this._mutex.runExclusive(() => {
      // 1. Find the active ticket
      const ticket = this.ticketManager.getActiveTicket(licensePlate);
      if (!ticket) {
        throw new Error(`No active ticket for vehicle: ${licensePlate}`);
      }

      // 2. Calculate fee
      const exitTime = new Date();
      const fee = this.feeCalculator.calculate(
        ticket.vehicle.vehicleType,
        ticket.entryTime,
        exitTime
      );

      // 3. Free the spot
      ticket.spot.vacate();

      // 4. Close the ticket
      this.ticketManager.closeTicket(licensePlate, fee);

      console.log(
        `[CHECK-OUT] ${ticket.vehicle} ← ${ticket.spot.spotId}  | ` +
        `Duration: ${ticket.getDurationHours()}h | Fee: $${fee.toFixed(2)}`
      );
      return { ticket, fee };
    });
  }

  // ─── Query helpers ────────────────────────────────────────────────────────

  /** Real-time availability across all floors. */
  getAvailability() {
    return this.allocator.getAvailabilityReport(this.floors);
  }

  /** Current fee rate card. */
  getRateCard() {
    return this.feeCalculator.getRateCard();
  }

  /** All active (parked) tickets. */
  getActiveTickets() {
    return this.ticketManager.getActiveTickets();
  }

  /** All completed parking sessions. */
  getParkingHistory() {
    return this.ticketManager.getHistory();
  }

  /** Total revenue collected. */
  getTotalRevenue() {
    return this.ticketManager.getTotalRevenue();
  }

  /** Retrieve a specific ticket by ID. */
  getTicket(ticketId) {
    return this.ticketManager.getTicketById(ticketId);
  }

  toString() {
    const avail = this.getAvailability();
    const lines = [`\n=== ${this.name} ===`];
    for (const floorData of avail.floors) {
      const floor = this.floors.find(f => f.floorNumber === floorData.floor);
      lines.push(`  ${floor}`);
    }
    lines.push('  Totals:');
    for (const [size, counts] of Object.entries(avail.totals)) {
      lines.push(`    ${size}: ${counts.available}/${counts.total} available`);
    }
    return lines.join('\n');
  }
}

ParkingLot._instance = null;

module.exports = ParkingLot;
