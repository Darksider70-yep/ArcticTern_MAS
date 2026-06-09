// ArcticTern ATC — Airport Static Model
// Defines the physical layout: runways, taxiways, gates, approach paths

export const AIRPORT_WIDTH = 1000;
export const AIRPORT_HEIGHT = 700;

// Runway definitions
export const RUNWAYS = [
  {
    id: '09L/27R',
    name: '09L/27R',
    x1: 150, y1: 280,
    x2: 850, y2: 280,
    width: 12,
    active: true,
    direction: 0, // degrees, 0 = east
  },
  {
    id: '09R/27L',
    name: '09R/27L',
    x1: 150, y1: 420,
    x2: 850, y2: 420,
    width: 12,
    active: true,
    direction: 0,
  },
];

// Gate positions (along terminal arc)
export const GATES = [
  { id: 'A1', x: 350, y: 540, occupied: false, angle: -90 },
  { id: 'A2', x: 410, y: 540, occupied: false, angle: -90 },
  { id: 'A3', x: 470, y: 540, occupied: false, angle: -90 },
  { id: 'A4', x: 530, y: 540, occupied: false, angle: -90 },
  { id: 'B1', x: 590, y: 540, occupied: false, angle: -90 },
  { id: 'B2', x: 650, y: 540, occupied: false, angle: -90 },
  { id: 'B3', x: 710, y: 540, occupied: false, angle: -90 },
  { id: 'B4', x: 770, y: 540, occupied: false, angle: -90 },
];

// Terminal building
export const TERMINAL = {
  x: 330, y: 560,
  width: 460, height: 80,
};

// Taxiway network nodes
export const TAXIWAY_NODES = [
  // Runway 1 exit points
  { id: 'R1E1', x: 400, y: 280 },
  { id: 'R1E2', x: 600, y: 280 },
  // Runway 2 exit points
  { id: 'R2E1', x: 400, y: 420 },
  { id: 'R2E2', x: 600, y: 420 },
  // Taxiway junctions
  { id: 'T1', x: 400, y: 350 },
  { id: 'T2', x: 600, y: 350 },
  { id: 'T3', x: 400, y: 480 },
  { id: 'T4', x: 600, y: 480 },
  { id: 'T5', x: 500, y: 350 },
  { id: 'T6', x: 500, y: 480 },
  // Gate approach
  { id: 'GA1', x: 350, y: 520 },
  { id: 'GA2', x: 530, y: 520 },
  { id: 'GA3', x: 770, y: 520 },
];

// Taxiway connections (edges)
export const TAXIWAY_EDGES = [
  ['R1E1', 'T1'], ['R1E2', 'T2'],
  ['R2E1', 'T3'], ['R2E2', 'T4'],
  ['T1', 'T5'], ['T5', 'T2'],
  ['T1', 'T3'], ['T2', 'T4'],
  ['T3', 'T6'], ['T6', 'T4'],
  ['T3', 'GA1'], ['T6', 'GA2'], ['T4', 'GA3'],
  ['R1E1', 'R2E1'], ['R1E2', 'R2E2'],
];

// Approach paths (where aircraft enter the map)
export const APPROACH_PATHS = [
  { id: 'NORTH', x: 500, y: -50, angle: 180 },
  { id: 'SOUTH', x: 500, y: 750, angle: 0 },
  { id: 'EAST', x: 1050, y: 350, angle: 270 },
  { id: 'WEST', x: -50, y: 350, angle: 90 },
];

// Departure paths
export const DEPARTURE_PATHS = [
  { id: 'DEP_NE', x: 1050, y: -50, angle: 45 },
  { id: 'DEP_NW', x: -50, y: -50, angle: 315 },
  { id: 'DEP_SE', x: 1050, y: 750, angle: 135 },
  { id: 'DEP_SW', x: -50, y: 750, angle: 225 },
];

// Holding pattern zones (circular orbits)
export const HOLDING_ZONES = [
  { id: 'HOLD_N', cx: 300, cy: 100, radius: 60 },
  { id: 'HOLD_S', cx: 700, cy: 100, radius: 60 },
];

// Aircraft callsign generator
const AIRLINES = ['AA', 'UA', 'DL', 'BA', 'LH', 'AF', 'EK', 'SQ', 'QF', 'CX', 'JL', 'KE'];
let flightCounter = 100;

export function generateCallsign() {
  const airline = AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
  return `${airline}${flightCounter++}`;
}

// Aircraft types with characteristics
export const AIRCRAFT_TYPES = [
  { type: 'A320', speed: 4.5, fuelRate: 0.012, separationClass: 'MEDIUM', size: 8 },
  { type: 'B737', speed: 4.2, fuelRate: 0.010, separationClass: 'MEDIUM', size: 8 },
  { type: 'A380', speed: 3.8, fuelRate: 0.018, separationClass: 'HEAVY', size: 12 },
  { type: 'B777', speed: 4.0, fuelRate: 0.015, separationClass: 'HEAVY', size: 10 },
  { type: 'E190', speed: 4.8, fuelRate: 0.008, separationClass: 'LIGHT', size: 6 },
];

// Minimum separation distances (nm equivalent in our coordinate space)
export const SEPARATION_RULES = {
  'HEAVY-HEAVY': 40,
  'HEAVY-MEDIUM': 50,
  'HEAVY-LIGHT': 60,
  'MEDIUM-HEAVY': 30,
  'MEDIUM-MEDIUM': 30,
  'MEDIUM-LIGHT': 40,
  'LIGHT-HEAVY': 30,
  'LIGHT-MEDIUM': 30,
  'LIGHT-LIGHT': 30,
};

export function getMinSeparation(class1, class2) {
  return SEPARATION_RULES[`${class1}-${class2}`] || 30;
}
