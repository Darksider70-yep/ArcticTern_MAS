// ArcticTern ATC — Template-based Agent Narration
// Generates human-readable explanations for agent decisions

const TEMPLATES = {
  weather: {
    CLEAR: [
      '⛅ Weather Agent: Conditions clear. Visibility {visibility}km, wind {wind}kts from {windDir}.',
      '⛅ Weather Agent: All clear — no weather threats detected. Maintaining normal operations.',
    ],
    CLOUDY: [
      '🌥️ Weather Agent: Cloud cover increasing. Visibility dropping to {visibility}km. Monitoring closely.',
      '🌥️ Weather Agent: Overcast conditions developing. No immediate impact on operations.',
    ],
    STORM: [
      '⚡ Weather Agent: STORM ALERT — Severe cell detected at sector {sector}, intensity {intensity}/10. Recommending runway configuration change.',
      '⚡ Weather Agent: Thunderstorm approaching from {windDir}. Wind gusts up to {wind}kts. Advising all agents.',
      '⚡ Weather Agent: Storm cell moving {stormDir}. ETA to airport: {eta} minutes. Initiating weather protocol.',
    ],
    CLEARING: [
      '🌤️ Weather Agent: Storm weakening. Visibility improving to {visibility}km. Gradual return to normal ops.',
      '🌤️ Weather Agent: Weather clearing. Recommending phased resumption of full operations.',
    ],
  },
  runway: {
    CLEAR_LANDING: [
      '🛬 Runway Agent: Cleared {callsign} for landing on {runway}. Queue depth: {queue}. Wait: ~{wait}s.',
      '🛬 Runway Agent: {runway} cleared for {callsign} approach. Separation: {separation}nm — safe.',
    ],
    CLEAR_TAKEOFF: [
      '🛫 Runway Agent: {callsign} cleared for takeoff on {runway}. Runway utilization: {util}%.',
      '🛫 Runway Agent: Takeoff clearance granted to {callsign} on {runway}. Next departure in {wait}s.',
    ],
    HOLD: [
      '⏸️ Runway Agent: {runway} occupied. {callsign} instructed to hold. Position: #{position} in queue.',
      '⏸️ Runway Agent: Holding {callsign} — minimum separation not met. Retry in {wait}s.',
    ],
    SWITCH_RUNWAY: [
      '🔄 Runway Agent: Switching active runway from {oldRunway} to {runway} due to {reason}.',
    ],
  },
  gate: {
    ASSIGN_GATE: [
      '🅿 Gate Agent: Assigned Gate {gateId} to {callsign}. Turnaround time: {turnaround}min.',
      '🅿 Gate Agent: {callsign} → Gate {gateId}. Gate utilization: {util}%.',
    ],
    REASSIGN: [
      '🔄 Gate Agent: Reassigning {callsign} from Gate {oldGate} to Gate {gateId}. Reason: {reason}.',
    ],
    HOLD_TAXIWAY: [
      '⏸️ Gate Agent: No gates available. {callsign} holding on taxiway. {pending} aircraft waiting.',
    ],
    RELEASE: [
      '✅ Gate Agent: Gate {gateId} released by {callsign}. Turnaround complete.',
    ],
  },
  traffic: {
    SAFE: [
      '✈️ Traffic Agent: Airspace clear. {count} aircraft tracked. No conflicts detected.',
    ],
    CONFLICT_DETECTED: [
      '🚨 Traffic Agent: CONFLICT — {callsign1} and {callsign2} separation: {distance}nm (min: 3nm). Alerting coordinator!',
      '🚨 Traffic Agent: Potential conflict zone identified. {count} aircraft converging at sector {sector}.',
    ],
    CONGESTION: [
      '⚠️ Traffic Agent: High congestion in sector {sector}. {count} aircraft. Recommending spacing increase.',
    ],
    REROUTE: [
      '↩️ Traffic Agent: Suggesting reroute for {callsign} via waypoint {waypoint} to avoid conflict.',
    ],
  },
  coordinator: {
    RESOLVE_CONFLICT: [
      '🔧 Coordinator: Resolved conflict between {callsign1} and {callsign2}. {action}. Safety margin: {margin}nm.',
    ],
    SCHEDULE_UPDATE: [
      '🔧 Coordinator: Schedule updated. {arrivals} arrivals, {departures} departures queued. Efficiency: {score}%.',
    ],
    ALL_CLEAR: [
      '🔧 Coordinator: All systems nominal. Global reward: {reward}. No conflicts pending.',
    ],
    WEATHER_RESPONSE: [
      '🔧 Coordinator: Weather protocol activated. Adjusting all agent priorities. {action}.',
    ],
    LIVE_API_FETCH: [
      '📡 Coordinator: {msg}',
    ],
    LIVE_API_SUCCESS: [
      '📡 Coordinator: {msg}',
    ],
    LIVE_API_FALLBACK: [
      '📡 Coordinator: {msg}',
    ],
  },
  flight: {
    REQUEST_LANDING: [
      '🛩️ {callsign}: Requesting landing clearance. Fuel: {fuel}%, Distance: {distance}nm, ETA: {eta}s.',
    ],
    HOLD_PATTERN: [
      '🛩️ {callsign}: Entering hold pattern at {altitude}ft. Fuel remaining: {fuel}%.',
    ],
    LANDED: [
      '🛩️ {callsign}: Touchdown on {runway}! Delay: {delay}s. Taxiing to Gate {gateId}.',
    ],
    TAKEOFF: [
      '🛩️ {callsign}: Airborne from {runway}. Heading {heading}°. Safe travels!',
    ],
    DIVERT: [
      '🛩️ {callsign}: Diverting due to {reason}. Fuel critical: {fuel}%.',
    ],
  },
};

/**
 * Generate a narration string for an agent decision.
 * @param {string} agentType - e.g., 'weather', 'runway', 'gate', 'traffic', 'coordinator', 'flight'
 * @param {string} action - e.g., 'CLEAR_LANDING', 'STORM', etc.
 * @param {object} params - Key-value pairs to fill template placeholders
 * @returns {string} Human-readable narration
 */
export function narrate(agentType, action, params = {}) {
  const templates = TEMPLATES[agentType]?.[action];
  if (!templates || templates.length === 0) {
    return `${agentType}: ${action}`;
  }

  // Pick a random template for variety
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Fill in placeholders
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

/**
 * Generate a timestamped narration entry.
 */
export function createNarrationEntry(simTime, agentType, action, params = {}) {
  const hours = Math.floor(simTime / 3600) % 24;
  const minutes = Math.floor((simTime % 3600) / 60);
  const seconds = Math.floor(simTime % 60);
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    id: Date.now() + Math.random(),
    time: timeStr,
    simTime,
    agentType,
    action,
    text: narrate(agentType, action, params),
  };
}
