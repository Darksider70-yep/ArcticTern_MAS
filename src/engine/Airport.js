// ArcticTern ATC — Airport Static Model (Delhi IGI Airport DEL)
// Defines the physical layout: slanted runways, taxiways, gates, approach paths, waypoints

export const AIRPORT_WIDTH = 1000;
export const AIRPORT_HEIGHT = 800;

// Runway definitions for DEL (4 active slanted parallel runways)
// Oriented based on aerodrome chart (magnetic headings 09, 10, 11)
export const RUNWAYS = [
  {
    id: '09/27',
    name: '09/27',
    x1: 450, y1: 150,
    x2: 950, y2: 158,
    width: 12,
    active: true,
    direction: 0.8,
  },
  {
    id: '10/28',
    name: '10/28',
    x1: 200, y1: 300,
    x2: 850, y2: 350,
    width: 12,
    active: true,
    direction: 4.0,
  },
  {
    id: '11L/29R',
    name: '11L/29R',
    x1: 100, y1: 520,
    x2: 850, y2: 590,
    width: 12,
    active: true,
    direction: 5.3,
  },
  {
    id: '11R/29L',
    name: '11R/29L',
    x1: 100, y1: 650,
    x2: 850, y2: 720,
    width: 12,
    active: true,
    direction: 5.3,
  },
];

// Terminals bounding boxes & realistic layout polygons
export const TERMINALS = [
  { id: 'T1', name: 'TERMINAL 1 (LCC)', x: 700, y: 190, width: 140, height: 35 },
  { id: 'T2', name: 'TERMINAL 2', x: 300, y: 380, width: 100, height: 30 },
  { id: 'T3', name: 'TERMINAL 3', x: 180, y: 440, width: 220, height: 40 },
];

// Gate positions (along T1, T2, T3 terminals)
export const GATES = [
  // Terminal 1 Gates (Domestic LCC, Top Right)
  { id: 'T1-1', x: 710, y: 190, occupied: false, angle: -90, terminal: 'T1' },
  { id: 'T1-2', x: 750, y: 190, occupied: false, angle: -90, terminal: 'T1' },
  { id: 'T1-3', x: 790, y: 190, occupied: false, angle: -90, terminal: 'T1' },
  { id: 'T1-4', x: 830, y: 190, occupied: false, angle: -90, terminal: 'T1' },

  // Terminal 2 Gates (Domestic, Middle Left)
  { id: 'T2-1', x: 310, y: 380, occupied: false, angle: -90, terminal: 'T2' },
  { id: 'T2-2', x: 350, y: 380, occupied: false, angle: -90, terminal: 'T2' },
  { id: 'T2-3', x: 390, y: 380, occupied: false, angle: -90, terminal: 'T2' },

  // Terminal 3 Gates (International & Full Service Hub)
  // Positioned along the piers of T3
  { id: 'T3-1', x: 230, y: 480, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-2', x: 250, y: 480, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-3', x: 290, y: 480, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-4', x: 310, y: 480, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-5', x: 350, y: 480, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-6', x: 370, y: 480, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-7', x: 410, y: 480, occupied: false, angle: -90, terminal: 'T3' },
  { id: 'T3-8', x: 430, y: 480, occupied: false, angle: -90, terminal: 'T3' },
];

// Real airspace waypoints surrounding IGI Delhi Airport
export const WAYPOINTS = [
  { id: 'DPN VOR', x: 500, y: 400, type: 'VOR', name: 'PALAM VOR' },
  { id: 'RESA', x: 500, y: 80, type: 'FIX', name: 'RESA N' },
  { id: 'ELKAS', x: 150, y: 220, type: 'FIX', name: 'ELKAS W' },
  { id: 'IBROX', x: 850, y: 620, type: 'FIX', name: 'IBROX E' },
  { id: 'SAMAR', x: 500, y: 760, type: 'FIX', name: 'SAMAR S' },
];

// Taxiway network nodes matching the slanted runways and Eastern Cross Taxiways (ECT)
export const TAXIWAY_NODES = [
  // Runway 1 (09/27) exit points
  { id: 'R1E1', x: 550, y: 151 },
  { id: 'R1E2', x: 850, y: 156 },
  // Runway 2 (10/28) exit points
  { id: 'R2E1', x: 300, y: 307 },
  { id: 'R2E2', x: 750, y: 342 },
  // Runway 3 (11L/29R) exit points
  { id: 'R3E1', x: 200, y: 530 },
  { id: 'R3E2', x: 750, y: 580 },
  // Runway 4 (11R/29L) exit points
  { id: 'R4E1', x: 200, y: 660 },
  { id: 'R4E2', x: 750, y: 710 },

  // Eastern Cross Taxiway Nodes (ECT)
  { id: 'ECT_N1', x: 880, y: 160 },
  { id: 'ECT_M1', x: 880, y: 350 },
  { id: 'ECT_S1', x: 880, y: 600 },
  { id: 'ECT_N2', x: 910, y: 160 },
  { id: 'ECT_M2', x: 910, y: 350 },
  { id: 'ECT_S2', x: 910, y: 600 },

  // Terminal junction nodes
  { id: 'J_T1', x: 770, y: 240 },
  { id: 'J_T2', x: 350, y: 350 },
  { id: 'J_T3', x: 290, y: 510 },
  { id: 'J_C1', x: 550, y: 326 },
  { id: 'J_C2', x: 550, y: 563 },
];

// Taxiway connections (edges)
export const TAXIWAY_EDGES = [
  // Runway connections
  ['R1E1', 'J_C1'], ['R1E2', 'J_T1'],
  ['R2E1', 'J_T2'], ['R2E2', 'J_C1'], ['R2E2', 'ECT_M1'],
  ['R3E1', 'J_T3'], ['R3E2', 'J_C2'], ['R3E2', 'ECT_M2'],
  ['R4E1', 'J_C2'], ['R4E2', 'ECT_S2'],

  // ECT Vertical Bridges
  ['ECT_N1', 'ECT_M1'], ['ECT_M1', 'ECT_S1'],
  ['ECT_N2', 'ECT_M2'], ['ECT_M2', 'ECT_S2'],

  // Cross connections
  ['J_T1', 'ECT_N1'], ['J_T1', 'ECT_N2'],
  ['J_T2', 'J_T3'],
  ['J_C1', 'J_T2'], ['J_C2', 'J_T3'],
  ['J_C1', 'J_C2'],
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
