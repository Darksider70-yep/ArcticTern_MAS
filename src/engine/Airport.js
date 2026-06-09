// ArcticTern ATC — Airport Static Model (Delhi IGI Airport DEL)
// Defines the physical layout: runways, taxiways, gates, approach paths

export const AIRPORT_WIDTH = 1000;
export const AIRPORT_HEIGHT = 800;

// Runway definitions for DEL (4 active parallel runways)
export const RUNWAYS = [
  {
    id: '09/27',
    name: '09/27',
    x1: 150, y1: 150,
    x2: 800, y2: 150,
    width: 12,
    active: true,
    direction: 0, // degrees, 0 = east
  },
  {
    id: '10/28',
    name: '10/28',
    x1: 100, y1: 320,
    x2: 900, y2: 320,
    width: 12,
    active: true,
    direction: 0,
  },
  {
    id: '11L/29R',
    name: '11L/29R',
    x1: 80, y1: 520,
    x2: 920, y2: 520,
    width: 12,
    active: true,
    direction: 0,
  },
  {
    id: '11R/29L',
    name: '11R/29L',
    x1: 80, y1: 670,
    x2: 920, y2: 670,
    width: 12,
    active: true,
    direction: 0,
  },
];

// Gate positions (along T1, T2, T3 terminals)
export const GATES = [
  // Terminal 1 Gates (Domestic LCC)
  { id: 'T1-1', x: 200, y: 200, occupied: false, angle: -90, terminal: 'T1' },
  { id: 'T1-2', x: 250, y: 200, occupied: false, angle: -90, terminal: 'T1' },
  { id: 'T1-3', x: 300, y: 200, occupied: false, angle: -90, terminal: 'T1' },
  { id: 'T1-4', x: 350, y: 200, occupied: false, angle: -90, terminal: 'T1' },

  // Terminal 2 Gates (Domestic)
  { id: 'T2-1', x: 200, y: 400, occupied: false, angle: -90, terminal: 'T2' },
  { id: 'T2-2', x: 250, y: 400, occupied: false, angle: -90, terminal: 'T2' },
  { id: 'T2-3', x: 300, y: 400, occupied: false, angle: -90, terminal: 'T2' },

  // Terminal 3 Gates (International & Full Service Hub)
  { id: 'T3-1', x: 480, y: 400, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-2', x: 520, y: 400, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-3', x: 560, y: 400, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-4', x: 600, y: 400, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-5', x: 640, y: 400, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-6', x: 680, y: 400, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-7', x: 720, y: 400, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-8', x: 760, y: 400, occupied: false, angle: -90, terminal: 'T3' },
];

// Terminals bounding boxes
export const TERMINALS = [
  { id: 'T1', name: 'TERMINAL 1 (DOMESTIC LCC)', x: 180, y: 215, width: 190, height: 35 },
  { id: 'T2', name: 'TERMINAL 2', x: 180, y: 415, width: 140, height: 35 },
  { id: 'T3', name: 'TERMINAL 3 (INTL & FULL SERVICE)', x: 460, y: 415, width: 320, height: 35 },
];

// Taxiway network nodes
export const TAXIWAY_NODES = [
  // Runway 1 (y=150) exit points
  { id: 'R1E1', x: 300, y: 150 },
  { id: 'R1E2', x: 600, y: 150 },
  // Runway 2 (y=320) exit points
  { id: 'R2E1', x: 300, y: 320 },
  { id: 'R2E2', x: 600, y: 320 },
  // Runway 3 (y=520) exit points
  { id: 'R3E1', x: 300, y: 520 },
  { id: 'R3E2', x: 600, y: 520 },
  // Runway 4 (y=670) exit points
  { id: 'R4E1', x: 300, y: 670 },
  { id: 'R4E2', x: 600, y: 670 },

  // Central taxiway junctions
  { id: 'T1', x: 300, y: 260 },
  { id: 'T2', x: 600, y: 260 },
  { id: 'T3', x: 300, y: 460 },
  { id: 'T4', x: 600, y: 460 },
  { id: 'T5', x: 300, y: 600 },
  { id: 'T6', x: 600, y: 600 },

  // Gate approaches
  { id: 'GA_T1', x: 275, y: 180 },
  { id: 'GA_T2', x: 250, y: 380 },
  { id: 'GA_T3_1', x: 540, y: 380 },
  { id: 'GA_T3_2', x: 700, y: 380 },
];

// Taxiway connections (edges)
export const TAXIWAY_EDGES = [
  ['R1E1', 'T1'], ['R1E2', 'T2'],
  ['R2E1', 'T1'], ['R2E1', 'T3'],
  ['R2E2', 'T2'], ['R2E2', 'T4'],
  ['R3E1', 'T3'], ['R3E1', 'T5'],
  ['R3E2', 'T4'], ['R3E2', 'T6'],
  ['R4E1', 'T5'], ['R4E2', 'T6'],

  ['T1', 'T2'], ['T3', 'T4'], ['T5', 'T6'],
  ['T1', 'T3'], ['T3', 'T5'], ['T2', 'T4'], ['T4', 'T6'],

  ['T1', 'GA_T1'], ['T3', 'GA_T2'],
  ['T3', 'GA_T3_1'], ['T4', 'GA_T3_2'],
];

// Approach paths (where aircraft enter the map)
export const APPROACH_PATHS = [
  { id: 'NORTH', x: 500, y: -50, angle: 90 },
  { id: 'SOUTH', x: 500, y: 850, angle: 270 },
  { id: 'EAST', x: 1050, y: 400, angle: 180 },
  { id: 'WEST', x: -50, y: 400, angle: 0 },
];

// Departure paths
export const DEPARTURE_PATHS = [
  { id: 'DEP_NE', x: 1050, y: -50, angle: 45 },
  { id: 'DEP_NW', x: -50, y: -50, angle: 315 },
  { id: 'DEP_SE', x: 1050, y: 850, angle: 135 },
  { id: 'DEP_SW', x: -50, y: 850, angle: 225 },
];

// Holding pattern zones (circular orbits)
export const HOLDING_ZONES = [
  { id: 'HOLD_N', cx: 300, cy: 70, radius: 50 },
  { id: 'HOLD_S', cx: 700, cy: 70, radius: 50 },
];

// Indian Airline Callsigns & others
const AIRLINES = ['AI', '6E', 'SG', 'UK', 'QP', 'EK', 'EY', 'QR', 'BA', 'SQ'];
let flightCounter = 200;

export function generateCallsign() {
  const airline = AIRLINES[Math.floor(Math.random() * AIRLINES.length)];
  return `${airline}${flightCounter++}`;
}

// Aircraft types with characteristics
export const AIRCRAFT_TYPES = [
  { type: 'A320', speed: 4.5, fuelRate: 0.012, separationClass: 'MEDIUM', size: 8 },
  { type: 'B737', speed: 4.2, fuelRate: 0.010, separationClass: 'MEDIUM', size: 8 },
  { type: 'A350', speed: 3.9, fuelRate: 0.016, separationClass: 'HEAVY', size: 11 },
  { type: 'B777', speed: 4.0, fuelRate: 0.015, separationClass: 'HEAVY', size: 10 },
  { type: 'ATR72', speed: 4.8, fuelRate: 0.008, separationClass: 'LIGHT', size: 6 },
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
