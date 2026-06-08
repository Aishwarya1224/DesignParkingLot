/**
 * TicketManager Service
 *
 * Manages the lifecycle of ParkingTickets.
 * Provides an in-memory store keyed by:
 *   - ticketId               (for quick look-up)
 *   - licensePlate           (to find active tickets by vehicle)
 */
const ParkingTicket = require('../models/ParkingTicket');

class TicketManager {
  constructor() {
    /** @type {Map<string, ParkingTicket>} ticketId → ticket */
    this._ticketsById   = new Map();

    /** @type {Map<string, ParkingTicket>} licensePlate → active ticket */
    this._activeByPlate = new Map();
  }

  /**
   * Create and store a new ticket for a vehicle checking in.
   * @param {Vehicle}      vehicle
   * @param {ParkingSpot}  spot
   * @returns {ParkingTicket}
   */
  createTicket(vehicle, spot) {
    if (this._activeByPlate.has(vehicle.licensePlate)) {
      throw new Error(
        `Vehicle ${vehicle.licensePlate} already has an active parking ticket`
      );
    }
    const ticket = new ParkingTicket(vehicle, spot);
    this._ticketsById.set(ticket.ticketId, ticket);
    this._activeByPlate.set(vehicle.licensePlate, ticket);
    return ticket;
  }

  /**
   * Close the active ticket for a vehicle checking out.
   * @param {string} licensePlate
   * @param {number} fee
   * @returns {ParkingTicket} The closed ticket
   */
  closeTicket(licensePlate, fee) {
    const ticket = this._activeByPlate.get(licensePlate);
    if (!ticket) {
      throw new Error(`No active ticket found for vehicle: ${licensePlate}`);
    }
    ticket.closeTicket(new Date(), fee);
    this._activeByPlate.delete(licensePlate);
    return ticket;
  }

  /**
   * Retrieve a ticket by its ID (active or historical).
   * @param {string} ticketId
   * @returns {ParkingTicket|undefined}
   */
  getTicketById(ticketId) {
    return this._ticketsById.get(ticketId);
  }

  /**
   * Retrieve the current active ticket for a vehicle.
   * @param {string} licensePlate
   * @returns {ParkingTicket|undefined}
   */
  getActiveTicket(licensePlate) {
    return this._activeByPlate.get(licensePlate.toUpperCase().trim());
  }

  /**
   * All historical (closed) tickets.
   * @returns {ParkingTicket[]}
   */
  getHistory() {
    return [...this._ticketsById.values()].filter(t => !t.isActive);
  }

  /**
   * All currently active tickets.
   * @returns {ParkingTicket[]}
   */
  getActiveTickets() {
    return [...this._activeByPlate.values()];
  }

  /**
   * Total revenue from all closed tickets.
   * @returns {number}
   */
  getTotalRevenue() {
    return this.getHistory().reduce((sum, t) => sum + (t.fee || 0), 0);
  }
}

module.exports = TicketManager;
