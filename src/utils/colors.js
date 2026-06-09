// ArcticTern ATC — Color Palette
// Dark ATC-inspired theme with neon accents

export const COLORS = {
  // Backgrounds
  bgPrimary: '#0a0e17',
  bgSecondary: '#111827',
  bgCard: 'rgba(17, 24, 39, 0.7)',
  bgCardHover: 'rgba(30, 41, 59, 0.8)',
  bgGlass: 'rgba(15, 23, 42, 0.6)',

  // Airport elements
  runway: '#3b82f6',
  runwayMarkings: '#60a5fa',
  taxiway: '#475569',
  taxiwayEdge: '#64748b',
  terminal: '#1e293b',
  terminalOutline: '#334155',
  gate: '#f59e0b',
  gateActive: '#fbbf24',
  grass: '#0f1a0f',
  apron: '#1a1a2e',

  // Aircraft states
  flightArriving: '#22d3ee',
  flightDeparting: '#a78bfa',
  flightHolding: '#f59e0b',
  flightConflict: '#ef4444',
  flightTaxiing: '#34d399',
  flightParked: '#6b7280',
  flightTrail: 'rgba(34, 211, 238, 0.3)',
  flightTrailDepart: 'rgba(167, 139, 250, 0.3)',

  // Agent colors
  agentWeather: '#38bdf8',
  agentRunway: '#3b82f6',
  agentGate: '#f59e0b',
  agentTraffic: '#a78bfa',
  agentFlight: '#22d3ee',
  agentCoordinator: '#10b981',

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',

  // Weather
  weatherClear: '#38bdf8',
  weatherCloudy: '#94a3b8',
  weatherStorm: '#f97316',
  weatherStormOverlay: 'rgba(249, 115, 22, 0.15)',

  // Text
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textAccent: '#22d3ee',

  // Misc
  gridLine: 'rgba(71, 85, 105, 0.3)',
  separator: 'rgba(71, 85, 105, 0.5)',
  glow: 'rgba(34, 211, 238, 0.4)',
};

// Score color based on value (0-100)
export function getScoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

// Agent emoji map
export const AGENT_ICONS = {
  weather: '⛅',
  runway: '🛬',
  gate: '🅿',
  traffic: '✈️',
  flight: '🛩️',
  coordinator: '🔧',
};
