// ArcticTern ATC — Scenario Presets
// Pre-configured simulation scenarios for demo

export const SCENARIOS = {
  NORMAL: {
    id: 'NORMAL',
    name: 'Normal Operations',
    description: 'Clear weather, steady traffic flow with 15 aircraft',
    icon: '✈️',
    initialFlights: { arrivals: 10, departures: 5 },
    spawnRate: 0.005,   // probability per tick of new aircraft
    maxFlights: 20,
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
    description: 'Peak traffic with 30 aircraft competing for resources',
    icon: '🔥',
    initialFlights: { arrivals: 18, departures: 12 },
    spawnRate: 0.015,
    maxFlights: 35,
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
    description: 'Severe weather causes rerouting and delays',
    icon: '⛈️',
    initialFlights: { arrivals: 10, departures: 5 },
    spawnRate: 0.003,
    maxFlights: 20,
    weather: {
      initial: 'STORM',
      forced: true,
      stormDelay: 0, // ticks before storm begins (0 = immediate)
    },
    runways: {
      bothActive: true,
      closedRunway: null,
    },
  },
  RUNWAY_CLOSURE: {
    id: 'RUNWAY_CLOSURE',
    name: 'Runway Closure',
    description: 'One runway closed for maintenance — increased congestion',
    icon: '🚧',
    initialFlights: { arrivals: 12, departures: 8 },
    spawnRate: 0.008,
    maxFlights: 25,
    weather: {
      initial: 'CLEAR',
      forced: true,
    },
    runways: {
      bothActive: false,
      closedRunway: 1, // Close runway index 1 (09R/27L)
    },
  },
};

export function getScenario(id) {
  return SCENARIOS[id] || SCENARIOS.NORMAL;
}

export function getScenarioList() {
  return Object.values(SCENARIOS);
}
