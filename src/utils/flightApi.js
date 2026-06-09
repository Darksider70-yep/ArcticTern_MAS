// ArcticTern ATC — Live Flight Data API Client & Offline Dataset
// Fetches live transponder records around Delhi (VIDP) and translates them to canvas space

export const DEL_AIRPORT_CENTER = { lat: 28.5562, lon: 77.1000 };

// Bounding box for approach sectors (~50km radius)
export const BBOX = {
  lamin: 28.3562,
  lamax: 28.7562,
  lomin: 76.8500,
  lomax: 77.3500,
};

// Major Airlines at DEL
export function getAircraftInfo(callsign) {
  const code = callsign.trim().toUpperCase();
  let carrier;
  let type;
  let size;
  let separationClass;
  let fuelRate;

  if (code.startsWith('AI') || code.startsWith('AIC')) {
    carrier = 'Air India';
    const rand = Math.random();
    if (rand < 0.3) {
      type = 'A350';
      separationClass = 'HEAVY';
      size = 11;
      fuelRate = 0.016;
    } else if (rand < 0.6) {
      type = 'B777';
      separationClass = 'HEAVY';
      size = 10;
      fuelRate = 0.015;
    } else {
      type = 'A320';
      separationClass = 'MEDIUM';
      size = 8;
      fuelRate = 0.012;
    }
  } else if (code.startsWith('6E') || code.startsWith('IGO')) {
    carrier = 'IndiGo';
    type = 'A320';
    separationClass = 'MEDIUM';
    size = 8;
    fuelRate = 0.012;
  } else if (code.startsWith('SG') || code.startsWith('SEJ')) {
    carrier = 'SpiceJet';
    type = 'B737';
    separationClass = 'MEDIUM';
    size = 8;
    fuelRate = 0.010;
  } else if (code.startsWith('UK') || code.startsWith('VTI')) {
    carrier = 'Vistara';
    const rand = Math.random();
    if (rand < 0.5) {
      type = 'B777';
      separationClass = 'HEAVY';
      size = 10;
      fuelRate = 0.015;
    } else {
      type = 'A320';
      separationClass = 'MEDIUM';
      size = 8;
      fuelRate = 0.012;
    }
  } else if (code.startsWith('QP') || code.startsWith('AKJ')) {
    carrier = 'Akasa Air';
    type = 'B737';
    separationClass = 'MEDIUM';
    size = 8;
    fuelRate = 0.010;
  } else if (code.startsWith('EK') || code.startsWith('UAE')) {
    carrier = 'Emirates';
    type = 'B777';
    separationClass = 'HEAVY';
    size = 10;
    fuelRate = 0.015;
  } else if (code.startsWith('EY') || code.startsWith('ETD')) {
    carrier = 'Etihad';
    type = 'B777';
    separationClass = 'HEAVY';
    size = 10;
    fuelRate = 0.015;
  } else if (code.startsWith('QR') || code.startsWith('QTR')) {
    carrier = 'Qatar Airways';
    type = 'B777';
    separationClass = 'HEAVY';
    size = 10;
    fuelRate = 0.015;
  } else if (code.startsWith('BA') || code.startsWith('BAW')) {
    carrier = 'British Airways';
    type = 'B777';
    separationClass = 'HEAVY';
    size = 10;
    fuelRate = 0.015;
  } else if (code.startsWith('SQ') || code.startsWith('SIA')) {
    carrier = 'Singapore Airlines';
    type = 'A350';
    separationClass = 'HEAVY';
    size = 11;
    fuelRate = 0.016;
  } else {
    // General aviation / Other
    const carriers = ['IndiGo', 'Air India', 'Vistara', 'SpiceJet', 'Akasa Air'];
    carrier = carriers[Math.floor(Math.random() * carriers.length)];
    const types = [
      { type: 'A320', separationClass: 'MEDIUM', size: 8, fuelRate: 0.012 },
      { type: 'B737', separationClass: 'MEDIUM', size: 8, fuelRate: 0.010 },
      { type: 'B777', separationClass: 'HEAVY', size: 10, fuelRate: 0.015 }
    ];
    const picked = types[Math.floor(Math.random() * types.length)];
    type = picked.type;
    separationClass = picked.separationClass;
    size = picked.size;
    fuelRate = picked.fuelRate;
  }

  return { carrier, type, size, separationClass, fuelRate };
}

// Bounding box conversions
export function mapCoordsToCanvas(lat, lon) {
  const widthRange = BBOX.lomax - BBOX.lomin;
  const heightRange = BBOX.lamax - BBOX.lamin;

  // Clamp within box
  const clampedLon = Math.max(BBOX.lomin, Math.min(BBOX.lomax, lon));
  const clampedLat = Math.max(BBOX.lamin, Math.min(BBOX.lamax, lat));

  const x = ((clampedLon - BBOX.lomin) / widthRange) * 1000;
  const y = ((BBOX.lamax - clampedLat) / heightRange) * 800; // Y is inverted

  return { x, y };
}

// Offline high-fidelity peak-hour IGI dataset (fallback)
export const FALLBACK_FLIGHTS = [
  // 8 Arrivals
  { callsign: 'AIC302', type: 'arrival', lat: 28.7000, lon: 76.9500, heading: 120, altitude: 7500, speed: 110, onGround: false },
  { callsign: 'IGO501', type: 'arrival', lat: 28.6800, lon: 77.2800, heading: 240, altitude: 8200, speed: 120, onGround: false },
  { callsign: 'VTI985', type: 'arrival', lat: 28.4500, lon: 76.9000, heading: 45, altitude: 9500, speed: 115, onGround: false },
  { callsign: 'SEJ408', type: 'arrival', lat: 28.4200, lon: 77.3000, heading: 315, altitude: 6200, speed: 108, onGround: false },
  { callsign: 'UAE510', type: 'arrival', lat: 28.5562, lon: 77.3400, heading: 180, altitude: 11500, speed: 130, onGround: false },
  { callsign: 'SIA406', type: 'arrival', lat: 28.5562, lon: 76.8600, heading: 0, altitude: 12500, speed: 125, onGround: false },
  { callsign: 'AKJ112', type: 'arrival', lat: 28.7200, lon: 77.0500, heading: 150, altitude: 5000, speed: 105, onGround: false },
  { callsign: 'BAW142', type: 'arrival', lat: 28.3800, lon: 77.1500, heading: 330, altitude: 10200, speed: 122, onGround: false },

  // 6 Departures at terminals (to be assigned to gates and simulated outwards)
  { callsign: 'AIC101', type: 'departure', lat: 28.5562, lon: 77.1000, heading: 0, altitude: 0, speed: 0, onGround: true, gateId: 'T3-1' },
  { callsign: 'IGO213', type: 'departure', lat: 28.5562, lon: 77.1000, heading: 0, altitude: 0, speed: 0, onGround: true, gateId: 'T1-1' },
  { callsign: 'VTI822', type: 'departure', lat: 28.5562, lon: 77.1000, heading: 0, altitude: 0, speed: 0, onGround: true, gateId: 'T2-1' },
  { callsign: 'QTR578', type: 'departure', lat: 28.5562, lon: 77.1000, heading: 0, altitude: 0, speed: 0, onGround: true, gateId: 'T3-3' },
  { callsign: 'AKJ504', type: 'departure', lat: 28.5562, lon: 77.1000, heading: 0, altitude: 0, speed: 0, onGround: true, gateId: 'T1-2' },
  { callsign: 'SG812', type: 'departure', lat: 28.5562, lon: 77.1000, heading: 0, altitude: 0, speed: 0, onGround: true, gateId: 'T1-3' },
];

/**
 * Fetches live flights inside the Delhi bbox.
 * Tries the Vite dev proxy first, then falls back to direct API, and finally to cached local data.
 * @returns {Promise<{flights: Array, source: string}>}
 */
export async function fetchIGIFlights() {
  const url = `/api/opensky/states/all?lamin=${BBOX.lamin}&lamax=${BBOX.lamax}&lomin=${BBOX.lomin}&lomax=${BBOX.lomax}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    const states = data.states || [];
    
    const parsedFlights = states
      .filter(state => {
        const lat = state[6];
        const lon = state[5];
        const altitudeMeters = state[7];
        const callsign = state[1];

        if (!callsign || lat === null || lon === null) return false;
        
        // Filter out high-altitude overflights (above 15,000 ft / 4572 meters)
        if (altitudeMeters && altitudeMeters > 4572) return false;
        
        return true;
      })
      .map(state => {
        const callsign = state[1].trim();
        const lon = state[5];
        const lat = state[6];
        const altitudeMeters = state[7] || 0;
        const altitude = Math.round(altitudeMeters * 3.28084); // Convert to feet
        const onGround = state[8];
        const velocity = state[9] || 0;
        const trueTrack = state[10] || 0;
        const verticalRate = state[11] || 0;

        // Map heading
        const heading = (trueTrack - 90 + 360) % 360;

        // Classify arrival vs departure
        let type = 'arrival';
        if (onGround) {
          type = 'departure'; // assume departure if on ground to populate gates
        } else if (verticalRate > 1.0) {
          type = 'departure'; // climbing out
        }

        return {
          callsign,
          type,
          lat,
          lon,
          heading,
          altitude,
          speed: velocity,
          onGround,
        };
      });

    return {
      flights: parsedFlights,
      source: 'live',
    };
  } catch (error) {
    console.warn("Failed fetching live flights via proxy, falling back to local dataset:", error);
    // If we're not in the dev server environment (e.g. static build) or API rate limited, return fallback
    return {
      flights: FALLBACK_FLIGHTS,
      source: 'fallback',
    };
  }
}
