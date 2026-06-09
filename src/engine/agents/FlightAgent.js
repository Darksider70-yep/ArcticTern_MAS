// ArcticTern ATC — Flight Agent
// Per-aircraft autonomous agent using Q-Learning

import { PythonDQNBridge } from '../QLearning.js';
import { AIRCRAFT_TYPES, generateCallsign, APPROACH_PATHS, RUNWAYS, HOLDING_ZONES, GATES } from '../Airport.js';
import { mapCoordsToCanvas, getAircraftInfo } from '../../utils/flightApi.js';

const ACTIONS = ['REQUEST_LANDING', 'HOLD_PATTERN', 'DIVERT', 'REQUEST_TAKEOFF', 'TAXI_TO_GATE', 'TAXI_TO_RUNWAY'];

// Shared DQN across all flight agents (they learn collectively)
export const sharedDQN = new PythonDQNBridge('flight', ACTIONS, 6, [32, 16]);

// Pre-seed shared flight DQN with continuous vectors
sharedDQN.seed([
  // state: [weather, fuel, queue, holding, distance, altitude]
  { state: [0.1, 0.9, 0.1, 0.0, 0.4, 0.3], action: 'REQUEST_LANDING', targetQ: 0.9 },
  { state: [0.1, 0.9, 0.1, 0.0, 0.4, 0.3], action: 'HOLD_PATTERN', targetQ: 0.1 },
  { state: [0.1, 0.9, 0.1, 0.0, 0.4, 0.3], action: 'DIVERT', targetQ: -0.5 },

  { state: [0.2, 0.7, 0.6, 1.0, 0.1, 0.2], action: 'REQUEST_LANDING', targetQ: 0.6 },
  { state: [0.2, 0.7, 0.6, 1.0, 0.1, 0.2], action: 'HOLD_PATTERN', targetQ: 0.8 },
  { state: [0.2, 0.7, 0.6, 1.0, 0.1, 0.2], action: 'DIVERT', targetQ: -0.3 },

  { state: [0.8, 0.1, 0.8, 1.0, 0.1, 0.2], action: 'DIVERT', targetQ: 0.9 },
  { state: [0.8, 0.1, 0.8, 1.0, 0.1, 0.2], action: 'REQUEST_LANDING', targetQ: -0.3 },
  { state: [0.8, 0.1, 0.8, 1.0, 0.1, 0.2], action: 'HOLD_PATTERN', targetQ: -0.8 },

  { state: [0.1, 0.15, 0.8, 1.0, 0.1, 0.1], action: 'REQUEST_LANDING', targetQ: 0.95 },
  { state: [0.1, 0.15, 0.8, 1.0, 0.1, 0.1], action: 'HOLD_PATTERN', targetQ: -0.9 },
  { state: [0.1, 0.15, 0.8, 1.0, 0.1, 0.1], action: 'DIVERT', targetQ: -0.3 },
], 30);

// Flight statuses
export const FLIGHT_STATUS = {
  APPROACHING: 'APPROACHING',
  HOLDING: 'HOLDING',
  LANDING: 'LANDING',
  LANDED: 'LANDED',
  TAXIING_TO_GATE: 'TAXIING_TO_GATE',
  PARKED: 'PARKED',
  TAXIING_TO_RUNWAY: 'TAXIING_TO_RUNWAY',
  WAITING_FOR_TAKEOFF: 'WAITING_FOR_TAKEOFF',
  DEPARTING: 'DEPARTING',
  DEPARTED: 'DEPARTED',
  DIVERTED: 'DIVERTED',
  GO_AROUND: 'GO_AROUND',
};

export class FlightAgent {
  constructor(type = 'arrival', specificType = null) {
    const acType = specificType || AIRCRAFT_TYPES[Math.floor(Math.random() * AIRCRAFT_TYPES.length)];
    this.callsign = generateCallsign();
    this.aircraftType = acType.type;
    this.speed = acType.speed;
    this.baseSpeed = acType.speed;
    this.fuelRate = acType.fuelRate;
    this.separationClass = acType.separationClass;
    this.size = acType.size;
    this.type = type; // 'arrival' or 'departure'

    // Position & navigation
    if (type === 'arrival') {
      const approach = APPROACH_PATHS[Math.floor(Math.random() * APPROACH_PATHS.length)];
      this.x = approach.x + (Math.random() - 0.5) * 80;
      this.y = approach.y;
      this.heading = approach.angle;
      this.targetX = 500;
      this.targetY = 400; // Delhi airport center
      this.altitude = 3000 + Math.random() * 2000;
      this.status = FLIGHT_STATUS.APPROACHING;
    } else {
      // Departures start at a gate
      this.x = 500;
      this.y = 400;
      this.heading = 0;
      this.targetX = 500;
      this.targetY = 400;
      this.altitude = 0;
      this.status = FLIGHT_STATUS.PARKED;
    }

    this.fuel = 60 + Math.random() * 40; // 60-100%
    this.delay = 0;
    this.totalDelay = 0;
    this.assignedRunway = null;
    this.assignedGate = null;
    this.holdTimer = 0;
    this.holdAngle = 0;
    this.trail = []; // position history for drawing trails
    this.maxTrailLength = 30;
    this.lastAction = null;
    this.createdAt = 0;
    this.landedAt = null;
    this.departedAt = null;
    this.qTable = sharedDQN;

    // Path for taxiing
    this.path = [];
    this.pathIndex = 0;
  }

  getStateVector(weatherSeverity, queuePosition) {
    return [
      weatherSeverity / 10.0,
      this.fuel / 100.0,
      queuePosition / 10.0,
      this.status === FLIGHT_STATUS.HOLDING ? 1.0 : 0.0,
      this.getDistanceToAirport() / 1200.0,
      this.altitude / 10000.0,
    ];
  }

  async decide(weatherSeverity, queuePosition) {
    if (this.status !== FLIGHT_STATUS.APPROACHING && this.status !== FLIGHT_STATUS.HOLDING) {
      return null;
    }

    const stateVec = this.getStateVector(weatherSeverity, queuePosition);
    const { action, qValue, wasExploration } = await this.qTable.chooseAction(stateVec);

    let reward;
    let effectiveAction = action;

    // Filter invalid actions based on current status
    if (this.status === FLIGHT_STATUS.APPROACHING) {
      if (action === 'REQUEST_TAKEOFF' || action === 'TAXI_TO_GATE' || action === 'TAXI_TO_RUNWAY') {
        effectiveAction = 'REQUEST_LANDING'; // fallback
      }
    }

    switch (effectiveAction) {
      case 'REQUEST_LANDING':
        reward = 0.5 - this.delay * 0.01;
        break;
      case 'HOLD_PATTERN':
        this.delay++;
        this.totalDelay++;
        reward = -0.1 - this.delay * 0.005;
        if (this.fuel < 20) reward -= 1.0; // Fuel critical
        break;
      case 'DIVERT':
        if (this.fuel < 15 || weatherSeverity > 8) {
          reward = 0.3; // Smart to divert
        } else {
          reward = -0.5; // Unnecessary diversion
        }
        break;
      default:
        reward = -0.05;
    }

    // Learn
    const nextStateVec = this.getStateVector(weatherSeverity, queuePosition);
    await this.qTable.learn(stateVec, effectiveAction, reward, nextStateVec);

    this.lastAction = effectiveAction;
    return {
      action: effectiveAction,
      qValue,
      wasExploration,
      callsign: this.callsign,
      fuel: Math.round(this.fuel),
      distance: Math.round(this.getDistanceToAirport()),
    };
  }

  getDistanceToAirport() {
    const dx = this.x - 500;
    const dy = this.y - 400;
    return Math.sqrt(dx * dx + dy * dy);
  }

  tick(simTime) {
    // Burn fuel
    if (this.status !== FLIGHT_STATUS.PARKED && this.status !== FLIGHT_STATUS.DEPARTED && this.status !== FLIGHT_STATUS.DIVERTED) {
      this.fuel -= this.fuelRate;
      this.fuel = Math.max(0, this.fuel);
    }

    // Record trail
    if (this.status === FLIGHT_STATUS.APPROACHING || this.status === FLIGHT_STATUS.HOLDING ||
        this.status === FLIGHT_STATUS.DEPARTING || this.status === FLIGHT_STATUS.GO_AROUND) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrailLength) this.trail.shift();
    }

    // Movement based on status
    switch (this.status) {
      case FLIGHT_STATUS.APPROACHING:
        this._moveToward(this.targetX, this.targetY, this.speed);
        this.altitude = Math.max(0, this.altitude - 20);
        if (this.getDistanceToAirport() < 80) {
          this.status = FLIGHT_STATUS.HOLDING;
          this.holdTimer = 0;
        }
        break;

      case FLIGHT_STATUS.HOLDING: {
        this.delay++;
        this.holdTimer++;
        this.holdAngle += 0.03;
        const holdZone = this.y < 400 ? HOLDING_ZONES[0] : HOLDING_ZONES[1];
        this.x = holdZone.cx + Math.cos(this.holdAngle) * 50;
        this.y = holdZone.cy + Math.sin(this.holdAngle) * 30;
        this.heading = (this.holdAngle * 180 / Math.PI + 90) % 360;
        break;
      }

      case FLIGHT_STATUS.LANDING: {
        const runway = RUNWAYS[this.assignedRunway] || RUNWAYS[0];
        const targetX = (runway.x1 + runway.x2) / 2;
        const pct = Math.max(0, Math.min(1, (this.x - runway.x1) / (runway.x2 - runway.x1)));
        const targetY = runway.y1 + pct * (runway.y2 - runway.y1);

        this._moveToward(targetX, targetY, this.speed * 1.2);
        this.altitude = Math.max(0, this.altitude - 50);

        if (Math.abs(this.y - targetY) < 8 && this.x > runway.x1 && this.x < runway.x2) {
          this.status = FLIGHT_STATUS.LANDED;
          this.altitude = 0;
          this.landedAt = simTime;
          this.y = targetY;
        }
        break;
      }

      case FLIGHT_STATUS.LANDED:
        // Brief pause on runway, then taxi
        this.speed = this.baseSpeed * 0.3;
        this.status = FLIGHT_STATUS.TAXIING_TO_GATE;
        break;

      case FLIGHT_STATUS.TAXIING_TO_GATE: {
        const gate = this.assignedGate;
        if (gate) {
          this._moveToward(gate.x, gate.y, 1.5);
          if (this._distanceTo(gate.x, gate.y) < 10) {
            this.status = FLIGHT_STATUS.PARKED;
            this.x = gate.x;
            this.y = gate.y;
            this.speed = 0;
          }
        }
        break;
      }

      case FLIGHT_STATUS.PARKED:
        // Wait for turnaround (handled by GateAgent)
        break;

      case FLIGHT_STATUS.TAXIING_TO_RUNWAY: {
        const runway = RUNWAYS[this.assignedRunway] || RUNWAYS[0];
        const runwayStartX = runway.x1 + 50;
        const pct = (runwayStartX - runway.x1) / (runway.x2 - runway.x1);
        const runwayStartY = runway.y1 + pct * (runway.y2 - runway.y1);

        this._moveToward(runwayStartX, runwayStartY, 1.5);
        if (this._distanceTo(runwayStartX, runwayStartY) < 15) {
          this.status = FLIGHT_STATUS.WAITING_FOR_TAKEOFF;
          this.heading = Math.atan2(runway.y2 - runway.y1, runway.x2 - runway.x1) * 180 / Math.PI;
          this.speed = 0;
        }
        break;
      }

      case FLIGHT_STATUS.WAITING_FOR_TAKEOFF:
        // Wait at the holding point for takeoff clearance
        break;

      case FLIGHT_STATUS.DEPARTING: {
        const runway = RUNWAYS[this.assignedRunway] || RUNWAYS[0];
        const headingRad = Math.atan2(runway.y2 - runway.y1, runway.x2 - runway.x1);
        this.x += Math.cos(headingRad) * this.speed * 2;
        this.y += Math.sin(headingRad) * this.speed * 2;
        this.heading = headingRad * 180 / Math.PI;
        this.altitude += 30;
        if (this.x > 1100 || this.x < -100 || this.y > 900 || this.y < -100) {
          this.status = FLIGHT_STATUS.DEPARTED;
          this.departedAt = simTime;
        }
        break;
      }

      case FLIGHT_STATUS.DIVERTED:
        this._moveToward(-100, -100, this.speed);
        break;

      case FLIGHT_STATUS.GO_AROUND:
        this._moveToward(this.targetX, -100, this.speed);
        this.altitude += 20;
        if (this.y < -50) {
          this.status = FLIGHT_STATUS.APPROACHING;
          this.y = -50;
        }
        break;
    }
  }

  _moveToward(tx, ty, speed) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;
    this.x += (dx / dist) * speed;
    this.y += (dy / dist) * speed;
    this.heading = Math.atan2(dy, dx) * 180 / Math.PI;
  }

  _distanceTo(tx, ty) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  clearToLand(runwayIndex) {
    this.assignedRunway = runwayIndex;
    this.status = FLIGHT_STATUS.LANDING;
    const runway = RUNWAYS[runwayIndex] || RUNWAYS[0];
    this.targetX = (runway.x1 + runway.x2) / 2;
    this.targetY = runway.y1 + 0.5 * (runway.y2 - runway.y1);
  }

  assignGate(gate) {
    this.assignedGate = gate;
  }

  clearToDepartTaxi(runwayIndex) {
    this.assignedRunway = runwayIndex;
    this.status = FLIGHT_STATUS.TAXIING_TO_RUNWAY;
  }

  initRealFlight(realState, gatesList = null) {
    this.callsign = realState.callsign;
    const info = getAircraftInfo(this.callsign);
    this.aircraftType = info.type;
    this.size = info.size;
    this.separationClass = info.separationClass;
    this.fuelRate = info.fuelRate;

    // Convert GPS lat/lon to canvas coordinates
    const canvasPos = mapCoordsToCanvas(realState.lat, realState.lon);
    this.x = canvasPos.x;
    this.y = canvasPos.y;
    this.heading = realState.heading;
    this.altitude = realState.altitude;

    // Map velocity to speed
    const velocity = realState.speed || 100;
    this.baseSpeed = Math.max(2.5, Math.min(6.0, velocity * 0.04));
    this.speed = this.baseSpeed;

    this.type = realState.type; // 'arrival' or 'departure'
    
    if (this.type === 'arrival') {
      this.status = FLIGHT_STATUS.APPROACHING;
      this.targetX = 500;
      this.targetY = 400;
    } else {
      // It's a departure
      if (realState.onGround) {
        this.status = FLIGHT_STATUS.PARKED;
        
        // Find a gate for this carrier
        const isLCC = ['6E', 'SG', 'QP'].includes(this.callsign.slice(0, 2));
        const gates = gatesList || GATES;
        let gate = gates.find(g => !g.occupied && (isLCC ? (g.id.startsWith('T1') || g.id.startsWith('T2')) : g.id.startsWith('T3')));
        if (!gate) {
          gate = gates.find(g => !g.occupied);
        }
        
        if (gate) {
          gate.occupied = true;
          gate.occupiedBy = this.callsign;
          gate.turnaroundTimer = 30 + Math.random() * 90;
          gate.turnaroundTotal = gate.turnaroundTimer;
          this.x = gate.x;
          this.y = gate.y;
          this.assignedGate = gate;
        }
      } else {
        this.status = FLIGHT_STATUS.DEPARTING;
      }
    }
  }

  getData() {
    return {
      callsign: this.callsign,
      aircraftType: this.aircraftType,
      type: this.type,
      status: this.status,
      x: this.x,
      y: this.y,
      heading: this.heading,
      altitude: Math.round(this.altitude),
      fuel: Math.round(this.fuel),
      delay: this.delay,
      totalDelay: this.totalDelay,
      separationClass: this.separationClass,
      size: this.size,
      assignedRunway: this.assignedRunway,
      assignedGate: this.assignedGate,
      trail: [...this.trail],
      lastAction: this.lastAction,
    };
  }

  isActive() {
    return this.status !== FLIGHT_STATUS.DEPARTED &&
           this.status !== FLIGHT_STATUS.DIVERTED;
  }
}
