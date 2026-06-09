// ArcticTern ATC — Scenario Presets
// Pre-configured simulation scenarios for demo

export const SCENARIOS = {
  NORMAL: {
    id: 'NORMAL',
    name: 'Normal Operations',
    description: 'Clear weather, steady traffic flow with 18 flights',
    icon: '✈️',
    initialFlights: { arrivals: 12, departures: 6 },
    spawnRate: 0.007,   // probability per tick of new aircraft
    maxFlights: 28,
    weather: {
      initial: 'CLEAR',
      forced: true,
    },
    runways: {
      bothActive: true,
      closedRunway: null,
    },
  },
  RUSH_HOUR: {
    id: 'RUSH_HOUR',
    name: 'Rush Hour',
    description: 'Peak traffic with 36 aircraft competing for runways',
    icon: '🔥',
    initialFlights: { arrivals: 22, departures: 14 },
    spawnRate: 0.018,
    maxFlights: 48,
    weather: {
      initial: 'CLEAR',
      forced: true,
    },
    runways: {
      bothActive: true,
      closedRunway: null,
    },
  },
  STORM: {
    id: 'STORM',
    name: 'Thunderstorm',
    description: 'Severe weather causes runway limitations & holds',
    icon: '⛈️',
    initialFlights: { arrivals: 12, departures: 6 },
    spawnRate: 0.004,
    maxFlights: 25,
    weather: {
      initial: 'STORM',
      forced: true,
      stormDelay: 0,
    },
    runways: {
      bothActive: true,
      closedRunway: null,
    },
  },
  RUNWAY_CLOSURE: {
    id: 'RUNWAY_CLOSURE',
    name: 'Runway Closure',
    description: 'Runway 10/28 closed for maintenance — operations rerouted',
    icon: '🚧',
    initialFlights: { arrivals: 15, departures: 10 },
    spawnRate: 0.010,
    maxFlights: 35,
    weather: {
      initial: 'CLEAR',
      forced: true,
    },
    runways: {
      bothActive: false,
      closedRunway: 1, // Close runway index 1 (10/28)
    },
  },
};

export function getScenario(id) {
  return SCENARIOS[id] || SCENARIOS.NORMAL;
}

export function getScenarioList() {
  return Object.values(SCENARIOS);
}
