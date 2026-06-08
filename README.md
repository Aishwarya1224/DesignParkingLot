# Smart Parking Lot — Low-Level Design (Node.js)

A backend system for managing a multi-floor smart parking lot. Handles vehicle check-in/check-out, automatic spot allocation, real-time availability tracking, and fee calculation.

---

## Features

- **Automatic spot allocation** — best-fit algorithm assigns the smallest compatible spot closest to the entrance
- **Check-in / Check-out** — records entry and exit times via `ParkingTicket`
- **Fee calculation** — hourly rates with a 15-minute grace period and a per-type daily cap
- **Real-time availability** — spot state updates instantly on every entry and exit
- **Concurrency-safe** — a `Mutex` serialises concurrent check-in/check-out requests so no two vehicles can claim the same spot

---

## Project Structure

```
src/
├── models/
│   ├── VehicleType.js     # Enum — MOTORCYCLE | CAR | BUS
│   ├── SpotSize.js        # Enum — SMALL | MEDIUM | LARGE
│   ├── Vehicle.js         # licensePlate + vehicleType
│   ├── ParkingSpot.js     # spotId, floor, size, occupied state
│   ├── ParkingTicket.js   # entry/exit times, fee, duration helpers
│   └── Floor.js           # builds & manages spots per floor
├── services/
│   ├── SpotAllocator.js   # Best-fit allocation algorithm
│   ├── FeeCalculator.js   # Hourly rate + grace period + daily cap
│   └── TicketManager.js   # In-memory ticket store (active + history)
├── core/
│   └── ParkingLot.js      # Singleton — central orchestrator
├── utils/
│   └── Mutex.js           # Async mutual-exclusion lock
├── index.js               # Public API barrel
└── demo.js                # End-to-end walkthrough
```

---

## Getting Started

```bash
# No external dependencies required — uses only Node.js built-ins
node src/demo.js
```

---

## Core API

### Create a parking lot

```js
const { ParkingLot } = require('./src');

ParkingLot.reset(); // clear singleton for a fresh instance

const lot = new ParkingLot(
  'CityCenter Parking',
  [
    { spotConfig: { SMALL: 20, MEDIUM: 30, LARGE: 10 } }, // Floor 1
    { spotConfig: { SMALL: 15, MEDIUM: 25, LARGE:  5 } }, // Floor 2
  ]
);
```

### Check-in a vehicle

```js
const { Vehicle, VehicleType } = require('./src');

const car = new Vehicle('MH01AB1234', VehicleType.CAR);
const { ticket, spot } = await lot.checkIn(car);

console.log(ticket.ticketId); // UUID
console.log(spot.spotId);     // e.g. "F1-M006"
```

### Check-out a vehicle

```js
const { ticket, fee } = await lot.checkOut('MH01AB1234');
console.log(`Fee: $${fee.toFixed(2)}`);
console.log(ticket.toString());
```

### Query availability

```js
console.log(lot.toString());          // human-readable summary
const report = lot.getAvailability(); // structured { floors, totals }
```

### Other queries

```js
lot.getRateCard();        // fee rate per vehicle type
lot.getActiveTickets();   // currently parked vehicles
lot.getParkingHistory();  // all completed sessions
lot.getTotalRevenue();    // sum of all collected fees
lot.getTicket(ticketId);  // look up a specific ticket
```

---

## Data Model

```
ParkingLot
  └── Floor[]
        └── ParkingSpot[]   (spotId, size, isOccupied, vehicle)

ParkingTicket
  ├── vehicle   → Vehicle (licensePlate, vehicleType)
  ├── spot      → ParkingSpot
  ├── entryTime
  ├── exitTime
  └── fee
```

---

## Spot Allocation Algorithm

Vehicles are matched to spots using a **best-fit** strategy to minimise wasted space:

| Vehicle type | Preferred spot sizes (in order) |
|---|---|
| MOTORCYCLE | SMALL → MEDIUM → LARGE |
| CAR | MEDIUM → LARGE |
| BUS | LARGE only |

Within a size category, the spot with the **lowest floor number and lowest spot number** (closest to the entrance) is chosen.

---

## Fee Calculation

| Vehicle | Hourly rate | Daily cap |
|---|---|---|
| MOTORCYCLE | $1.00 | $10.00 |
| CAR | $2.00 | $20.00 |
| BUS | $3.50 | $35.00 |

- Duration is **rounded up** to the next full hour.
- The first **15 minutes** are always free (grace period).
- Fees are capped at the daily maximum per vehicle type.

Rates can be overridden when constructing `ParkingLot`:

```js
const lot = new ParkingLot('My Lot', floorConfigs, {
  hourlyRates: { MOTORCYCLE: 0.50, CAR: 1.50, BUS: 3.00 },
  dailyCap:    { MOTORCYCLE: 5.00, CAR: 15.00, BUS: 30.00 },
  gracePeriodMinutes: 10,
});
```

---

## Concurrency Handling

Node.js is single-threaded but async operations can interleave at `await` boundaries. A custom `Mutex` (`src/utils/Mutex.js`) ensures that `checkIn` and `checkOut` are executed one at a time, preventing race conditions such as two vehicles being assigned the same spot.

```
request A ──► acquire lock ──► allocate spot ──► release lock
request B ──────────────────► waiting ──────────► acquire lock ──► allocate spot ──► release lock
```
