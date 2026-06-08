/**
 * demo.js
 *
 * End-to-end walkthrough of the ParkingLot system:
 *   1. Create a 3-floor lot
 *   2. Display the rate card
 *   3. Check-in multiple vehicles (including concurrent requests)
 *   4. Display real-time availability
 *   5. Check-out vehicles and display fees
 *   6. Show total revenue
 *   7. Attempt to park in a full lot (bus section)
 */

'use strict';

const { ParkingLot, Vehicle, VehicleType } = require('./index');

// ─── Helper: sleep to simulate time passage ───────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Helper: section header ───────────────────────────────────────────────
const section = title =>
  console.log(`\n${'─'.repeat(60)}\n  ${title}\n${'─'.repeat(60)}`);

// ─── Configure the parking lot ────────────────────────────────────────────
// Reset singleton so each demo run starts fresh
ParkingLot.reset();

const lot = new ParkingLot(
  'CityCenter Parking',
  [
    { spotConfig: { SMALL: 5, MEDIUM: 5, LARGE: 1 } }, // Floor 1 — only 1 LARGE spot
    { spotConfig: { SMALL: 3, MEDIUM: 4, LARGE: 0 } }, // Floor 2
    { spotConfig: { SMALL: 2, MEDIUM: 3, LARGE: 0 } }, // Floor 3
  ]
);

// ─── Vehicles ─────────────────────────────────────────────────────────────
const vehicles = [
  new Vehicle('MH01AB1234', VehicleType.CAR),
  new Vehicle('MH02CD5678', VehicleType.MOTORCYCLE),
  new Vehicle('MH03EF9012', VehicleType.BUS),
  new Vehicle('DL04GH3456', VehicleType.CAR),
  new Vehicle('KA05IJ7890', VehicleType.MOTORCYCLE),
  new Vehicle('TN06KL2345', VehicleType.CAR),
];

async function runDemo() {
  // 1. Rate card
  section('RATE CARD');
  console.table(lot.getRateCard());

  // 2. Initial availability
  section('INITIAL AVAILABILITY');
  console.log(lot.toString());

  // 3. Check-in vehicles (simulate concurrent entries)
  section('CHECK-IN — concurrent batch');
  const checkInResults = await Promise.all(vehicles.map(v => lot.checkIn(v)));

  // 4. Real-time availability after check-ins
  section('AVAILABILITY AFTER CHECK-INS');
  console.log(lot.toString());

  // 5. Edge case: try parking a second bus while the only LARGE spot is taken
  section('EDGE CASE — try parking extra bus (no LARGE spot free)');
  const extraBus = new Vehicle('GJ07MN0001', VehicleType.BUS);
  try {
    await lot.checkIn(extraBus);
    console.log('  [Unexpected] Extra bus parked — should not happen!');
  } catch (err) {
    console.log(`  Expected error → ${err.message}`);
  }

  // 6. Display active tickets
  section('ACTIVE TICKETS');
  for (const { ticket } of checkInResults) {
    console.log(
      `  ${ticket.vehicle.licensePlate.padEnd(12)} | Spot: ${ticket.spot.spotId.padEnd(8)} | Entry: ${ticket.entryTime.toISOString()}`
    );
  }

  // 6. Simulate time passing (1 second ≈ represents parked duration for demo)
  await sleep(1000);

  // 7. Check-out first 3 vehicles
  section('CHECK-OUT — first 3 vehicles');
  for (const v of vehicles.slice(0, 3)) {
    try {
      const { ticket, fee } = await lot.checkOut(v.licensePlate);
      console.log(`\n${ticket.toString()}`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }

  // 8. Availability after partial checkout
  section('AVAILABILITY AFTER PARTIAL CHECK-OUT');
  console.log(lot.toString());

  // 9. Check-out remaining vehicles
  section('CHECK-OUT — remaining vehicles');
  for (const v of vehicles.slice(3)) {
    try {
      const { ticket, fee } = await lot.checkOut(v.licensePlate);
      console.log(`  ${v.licensePlate.padEnd(12)} | Fee: $${fee.toFixed(2)}`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }

  // 11. Revenue summary
  section('REVENUE SUMMARY');
  const history = lot.getParkingHistory();
  console.log(`  Total sessions : ${history.length}`);
  console.log(`  Total revenue  : $${lot.getTotalRevenue().toFixed(2)}`);

  // 12. Final availability (should be fully empty)
  section('FINAL AVAILABILITY (should be fully free)');
  console.log(lot.toString());
}

runDemo().catch(err => {
  console.error('Demo failed:', err);
  process.exit(1);
});
