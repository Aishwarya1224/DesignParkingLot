/**
 * ParkingTicket Model
 * Represents a transaction record for one parking session.
 */
const { randomUUID } = require('crypto');

class ParkingTicket {
  /**
   * @param {Vehicle}      vehicle    - The vehicle being parked
   * @param {ParkingSpot}  spot       - The allocated spot
   */
  constructor(vehicle, spot) {
    this.ticketId  = randomUUID();
    this.vehicle   = vehicle;
    this.spot      = spot;
    this.entryTime = new Date();
    this.exitTime  = null;     // set on check-out
    this.fee       = null;     // set on check-out
    this.isActive  = true;
  }

  /**
   * Close the ticket on vehicle exit.
   * @param {Date}   exitTime
   * @param {number} fee - Calculated fee in dollars
   */
  closeTicket(exitTime, fee) {
    this.exitTime = exitTime;
    this.fee      = fee;
    this.isActive = false;
  }

  /**
   * Duration of parking in milliseconds.
   * Uses current time if ticket is still active.
   */
  getDurationMs() {
    const end = this.exitTime || new Date();
    return end - this.entryTime;
  }

  /**
   * Duration in hours (rounded up to next full hour).
   */
  getDurationHours() {
    return Math.ceil(this.getDurationMs() / (1000 * 60 * 60));
  }

  toString() {
    return (
      `Ticket[${this.ticketId}]\n` +
      `  Vehicle  : ${this.vehicle}\n` +
      `  Spot     : ${this.spot.spotId}\n` +
      `  Entry    : ${this.entryTime.toISOString()}\n` +
      `  Exit     : ${this.exitTime ? this.exitTime.toISOString() : 'N/A'}\n` +
      `  Fee      : ${this.fee !== null ? `$${this.fee.toFixed(2)}` : 'N/A'}`
    );
  }
}

module.exports = ParkingTicket;
