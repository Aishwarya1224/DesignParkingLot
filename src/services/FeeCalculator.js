/**
 * FeeCalculator Service
 *
 * Calculates parking fees based on:
 *   - Duration of stay (rounded up to the next full hour)
 *   - Vehicle type (different hourly rates)
 *
 * Rate card (USD per hour):
 *   MOTORCYCLE : $1.00 / hr
 *   CAR        : $2.00 / hr
 *   BUS        : $3.50 / hr
 *
 * Additional rules:
 *   - First 15 minutes are always free (grace period).
 *   - Maximum daily cap per vehicle type applies.
 */
const VehicleType = require('../models/VehicleType');

const HOURLY_RATES = {
  [VehicleType.MOTORCYCLE]: 1.00,
  [VehicleType.CAR]:        2.00,
  [VehicleType.BUS]:        3.50,
};

/** Maximum fee charged per 24-hour period (daily cap) */
const DAILY_CAP = {
  [VehicleType.MOTORCYCLE]: 10.00,
  [VehicleType.CAR]:        20.00,
  [VehicleType.BUS]:        35.00,
};

/** Free grace period in minutes */
const GRACE_PERIOD_MINUTES = 15;

class FeeCalculator {
  /**
   * @param {Object} [config] - Optional override for rates & caps
   * @param {Object} [config.hourlyRates]
   * @param {Object} [config.dailyCap]
   * @param {number} [config.gracePeriodMinutes]
   */
  constructor(config = {}) {
    this.hourlyRates         = { ...HOURLY_RATES,         ...config.hourlyRates };
    this.dailyCap            = { ...DAILY_CAP,            ...config.dailyCap };
    this.gracePeriodMinutes  = config.gracePeriodMinutes ?? GRACE_PERIOD_MINUTES;
  }

  /**
   * Calculate the fee for a completed (or in-progress) parking session.
   *
   * @param {VehicleType} vehicleType
   * @param {Date}        entryTime
   * @param {Date}        exitTime
   * @returns {number} Fee in USD, rounded to 2 decimal places
   */
  calculate(vehicleType, entryTime, exitTime) {
    const durationMs      = exitTime - entryTime;
    const durationMinutes = durationMs / (1000 * 60);

    // Grace period — free of charge
    if (durationMinutes <= this.gracePeriodMinutes) {
      return 0;
    }

    // Round up to next full hour
    const billableHours = Math.ceil(durationMinutes / 60);

    const rate     = this.hourlyRates[vehicleType];
    const cap      = this.dailyCap[vehicleType];
    const days     = Math.floor(durationMinutes / (60 * 24));
    const remaining = durationMinutes % (60 * 24);
    const remainingHours = Math.ceil(remaining / 60);

    // Fee = full-day caps + remaining hours fee
    let fee = days * cap + remainingHours * rate;

    // Clamp remaining portion to cap (avoid exceeding daily max)
    const remainingFee = Math.min(remainingHours * rate, cap);
    fee = days * cap + remainingFee;

    return Math.round(fee * 100) / 100; // round to 2 decimal places
  }

  /**
   * Get the configured hourly rate for a vehicle type.
   * @param {VehicleType} vehicleType
   */
  getRate(vehicleType) {
    return this.hourlyRates[vehicleType];
  }

  /**
   * Get the full rate card.
   */
  getRateCard() {
    return Object.entries(this.hourlyRates).map(([type, rate]) => ({
      vehicleType: type,
      hourlyRate:  `$${rate.toFixed(2)}`,
      dailyCap:    `$${this.dailyCap[type].toFixed(2)}`,
    }));
  }
}

module.exports = FeeCalculator;
