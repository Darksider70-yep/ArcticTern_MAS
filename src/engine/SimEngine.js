// ArcticTern ATC — Simulation Engine
// Master tick loop coordinating all agents

import { RUNWAYS } from './Airport.js';
import { WeatherAgent } from './agents/WeatherAgent.js';
import { RunwayAgent } from './agents/RunwayAgent.js';
import { GateAgent } from './agents/GateAgent.js';
import { TrafficAgent } from './agents/TrafficAgent.js';
import { FlightAgent, FLIGHT_STATUS, sharedDQN } from './agents/FlightAgent.js';
import { Coordinator } from './agents/Coordinator.js';
import { createNarrationEntry } from '../utils/narration.js';

export class SimEngine {
  constructor() {
    this.reset();
  }

  reset(options = {}) {
    const trafficMode = options.traffic || 'NORMAL';
    const weatherMode = options.weather || 'CLEAR';
    const closedRunways = options.closedRunways || [];

    this.trafficMode = trafficMode;
    this.weatherMode = weatherMode;
    this.closedRunways = [...closedRunways];

    const isRush = trafficMode === 'RUSH_HOUR';
    const isLive = trafficMode === 'LIVE_IGI';
    const isStorm = weatherMode === 'STORM';

    // 1. Initial flights configuration
    const initialArrivals = isRush ? 22 : (isLive ? 0 : 12);
    const initialDepartures = isRush ? 14 : (isLive ? 0 : 6);

    // 2. Spawn rate and limit
    let spawnRate = isRush ? 0.018 : 0.007;
    if (isStorm) {
      spawnRate = isRush ? 0.010 : 0.004; 
    }
    const maxFlights = isRush ? 48 : (isLive ? 40 : 28);

    this.spawnRate = spawnRate;
    this.maxFlights = maxFlights;
    this.scenarioId = `${trafficMode}_${weatherMode}`;

    // Time
    this.simTime = 14 * 3600; // Start at 14:00:00
    this.tickCount = 0;
    this.speed = this.speed || 1;          
    this.running = false;
    this.lastFrameTime = 0;

    // Agents
    this.weatherAgent = new WeatherAgent();
    this.runwayAgent = new RunwayAgent(RUNWAYS);
    this.gateAgent = new GateAgent();
    this.trafficAgent = new TrafficAgent();
    this.coordinator = new Coordinator();
    this.flights = [];

    // Apply weather
    if (isStorm) {
      this.weatherAgent.forceWeather('STORM');
    } else {
      this.weatherAgent.forceWeather('CLEAR');
    }

    // Apply runway config
    for (const idx of closedRunways) {
      if (this.runwayAgent.runways[idx]) {
        this.runwayAgent.runways[idx].active = false;
      }
    }

    // Spawn initial flights
    if (!isLive) {
      for (let i = 0; i < initialArrivals; i++) {
        this.flights.push(new FlightAgent('arrival'));
      }
      for (let i = 0; i < initialDepartures; i++) {
        const f = new FlightAgent('departure');
        const freeGate = this.gateAgent.gates.find(g => !g.occupied);
        if (freeGate) {
          freeGate.occupied = true;
          freeGate.occupiedBy = f.callsign;
          freeGate.turnaroundTimer = 30 + Math.random() * 90;
          freeGate.turnaroundTotal = freeGate.turnaroundTimer;
          f.x = freeGate.x;
          f.y = freeGate.y;
          f.assignedGate = freeGate;
        }
        this.flights.push(f);
      }
    }

    // Narration feed
    this.narrationLog = [];
    this.maxNarrations = 100;

    // Metrics history
    this.metricsHistory = {
      delays: [],
      fuel: [],
      runwayUtil: [],
      gateUtil: [],
      conflicts: [],
      score: [],
      timestamps: [],
    };

    if (!this.listeners) this.listeners = {};

    this._addNarration('coordinator', 'SCHEDULE_UPDATE', {
      arrivals: initialArrivals,
      departures: initialDepartures,
      score: 75,
    });
  }

  // Pub/sub
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      for (const cb of this.listeners[event]) cb(data);
    }
  }

  start() {
    this.running = true;
    this.lastFrameTime = performance.now();
    this._loop();
  }

  pause() {
    this.running = false;
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  _loop() {
    if (!this.running) return;

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;

    // Tick at ~60fps but simulation speed multiplied
    if (elapsed > 16) { // ~60fps
      const ticksThisFrame = this.speed;
      for (let i = 0; i < ticksThisFrame; i++) {
        this._tick();
      }
      this.lastFrameTime = now;
      this.emit('update', this.getSnapshot());
    }

    requestAnimationFrame(() => this._loop());
  }

  _tick() {
    this.tickCount++;
    this.simTime += 1;

    // 1. Weather update
    this.weatherAgent.tick();
    const weatherState = this.weatherAgent.getState();

    // Narrate weather changes (throttled)
    if (this.tickCount % 120 === 0) {
      this._addNarration('weather', weatherState.state, this.weatherAgent.getNarrationParams());
    }

    // 2. Flight agent decisions (throttled to every 30 ticks)
    const activeFlights = this.flights.filter(f => f.isActive());
    if (this.tickCount % 30 === 0) {
      for (const flight of activeFlights) {
        const queuePos = this._getQueuePosition(flight);
        flight.decide(weatherState.intensity, queuePos).then(decision => {
          if (decision) {
            if (decision.action === 'REQUEST_LANDING' && flight.status === FLIGHT_STATUS.HOLDING) {
              // Add to runway queue if not already in it
              const alreadyQueued = this.runwayAgent.runways.some(r =>
                r.queue.some(q => q.callsign === flight.callsign)
              );
              if (!alreadyQueued) {
                const bestRunway = this._getBestRunway();
                if (bestRunway !== null) {
                  this.runwayAgent.addToQueue(bestRunway, {
                    callsign: flight.callsign,
                    type: 'arrival',
                    separationClass: flight.separationClass,
                  });
                }
              }
            } else if (decision.action === 'HOLD_PATTERN') {
              if (flight.status === FLIGHT_STATUS.APPROACHING) {
                flight.status = FLIGHT_STATUS.HOLDING;
              }
            } else if (decision.action === 'DIVERT') {
              // Only actually divert if fuel is critically low or weather is extreme
              if (flight.fuel < 10 || weatherState.intensity > 8) {
                flight.status = FLIGHT_STATUS.DIVERTED;
                this._addNarration('flight', 'DIVERT', {
                  callsign: flight.callsign,
                  reason: flight.fuel < 10 ? 'fuel emergency' : 'severe weather',
                  fuel: Math.round(flight.fuel),
                });
              }
              // Otherwise ignore the divert decision (agent learns from negative reward)
            }
          }
        });
      }
    }

    // Auto-queue holding flights that aren't in any runway queue yet
    for (const flight of activeFlights) {
      if (flight.status === FLIGHT_STATUS.HOLDING) {
        const alreadyQueued = this.runwayAgent.runways.some(r =>
          r.queue.some(q => q.callsign === flight.callsign)
        );
        if (!alreadyQueued && this.tickCount % 60 === 0) {
          const bestRunway = this._getBestRunway();
          if (bestRunway !== null) {
            this.runwayAgent.addToQueue(bestRunway, {
              callsign: flight.callsign,
              type: 'arrival',
              separationClass: flight.separationClass,
            });
          }
        }
      }
    }

    // 3. Tick all flights (movement)
    for (const flight of this.flights) {
      flight.tick(this.simTime);
    }

    // 4. Traffic agent (conflict detection)
    const flightData = activeFlights.map(f => f.getData());
    this.trafficAgent.tick(flightData);

    // Narrate conflicts
    if (this.trafficAgent.lastAction === 'CONFLICT_DETECTED' && this.tickCount % 30 === 0) {
      this._addNarration('traffic', 'CONFLICT_DETECTED', this.trafficAgent.lastDecision);
    }

    // 5. Runway agent decisions
    this.runwayAgent.tick();
    if (this.tickCount % 15 === 0) {
      this.runwayAgent.decide(activeFlights, weatherState).then(runwayDecision => {
        if (!runwayDecision) return;
        if (runwayDecision.action === 'CLEAR_LANDING' && runwayDecision.callsign) {
          // Find the flight and clear it to land
          const flight = this.flights.find(f => f.callsign === runwayDecision.callsign);
          if (flight && (flight.status === FLIGHT_STATUS.HOLDING || flight.status === FLIGHT_STATUS.APPROACHING)) {
            const runwayIdx = this.runwayAgent.runways.findIndex(r => r.name === runwayDecision.runway);
            flight.clearToLand(runwayIdx >= 0 ? runwayIdx : 0);
            this._addNarration('runway', 'CLEAR_LANDING', {
              callsign: flight.callsign,
              runway: runwayDecision.runway || '09/27',
              queue: runwayDecision.queue || 0,
              wait: runwayDecision.wait || 0,
              separation: '4.5',
            });
          }
        } else if (runwayDecision.action === 'CLEAR_TAKEOFF' && runwayDecision.callsign) {
          const flight = this.flights.find(f => f.callsign === runwayDecision.callsign);
          if (flight && flight.status === FLIGHT_STATUS.WAITING_FOR_TAKEOFF) {
            flight.status = FLIGHT_STATUS.DEPARTING;
            const runway = RUNWAYS[flight.assignedRunway] || RUNWAYS[0];
            flight.heading = Math.atan2(runway.y2 - runway.y1, runway.x2 - runway.x1) * 180 / Math.PI;
            flight.speed = flight.baseSpeed * 1.5;
            this._addNarration('runway', 'CLEAR_TAKEOFF', {
              callsign: flight.callsign,
              runway: runwayDecision.runway || '10/28',
              util: this.runwayAgent.getUtilization(),
              wait: '30',
            });
          }
        }
      });
    }

    // 6. Gate agent decisions
    this.gateAgent.tick();
    // Landed flights need gates
    for (const flight of this.flights) {
      if (flight.status === FLIGHT_STATUS.LANDED && !flight.assignedGate) {
        this.gateAgent.requestGate({ callsign: flight.callsign });
      }
    }

    if (this.tickCount % 20 === 0) {
      this.gateAgent.decide().then(gateDecision => {
        if (!gateDecision) return;
        if (gateDecision.action === 'ASSIGN_GATE' && gateDecision.callsign) {
          const flight = this.flights.find(f => f.callsign === gateDecision.callsign);
          const gate = this.gateAgent.gates.find(g => g.id === gateDecision.gateId);
          if (flight && gate) {
            flight.assignGate(gate);
            this._addNarration('gate', 'ASSIGN_GATE', gateDecision);
          }
        } else if (gateDecision.action === 'RELEASE' && gateDecision.callsign) {
          this._addNarration('gate', 'RELEASE', gateDecision);
          const flight = this.flights.find(f => f.callsign === gateDecision.callsign);
          if (flight && flight.status === FLIGHT_STATUS.PARKED) {
            const gate = this.gateAgent.gates.find(g => g.id === gateDecision.gateId);
            if (gate) {
              gate.occupied = false;
              gate.occupiedBy = null;
            }
            const bestRunway = this._getBestRunway();
            if (bestRunway !== null) {
              flight.clearToDepartTaxi(bestRunway);
              this.runwayAgent.addToQueue(bestRunway, {
                callsign: flight.callsign,
                type: 'departure',
                separationClass: flight.separationClass,
              });
            }
          }
        }
      });
    }

    // 7. Coordinator
    if (this.tickCount % 30 === 0) {
      const coordResult = this.coordinator.tick(
        flightData,
        weatherState,
        this.trafficAgent.getStatus(),
        this.runwayAgent.getStatus(),
        this.gateAgent.getStatus()
      );

      if (coordResult.type === 'RESOLVE_CONFLICT' && coordResult.holdFlights) {
        for (const callsign of coordResult.holdFlights) {
          const flight = this.flights.find(f => f.callsign === callsign);
          if (flight && flight.status === FLIGHT_STATUS.APPROACHING) {
            flight.status = FLIGHT_STATUS.HOLDING;
          }
        }
        this._addNarration('coordinator', 'RESOLVE_CONFLICT', this.coordinator.lastDecision);
      } else if (coordResult.type === 'WEATHER_PROTOCOL') {
        this._addNarration('coordinator', 'WEATHER_RESPONSE', this.coordinator.lastDecision);
      }
    }

    // 8. Spawn new flights
    if (this.trafficMode !== 'LIVE_IGI' && Math.random() < this.spawnRate && activeFlights.length < this.maxFlights) {
      const type = Math.random() < 0.6 ? 'arrival' : 'departure';
      const newFlight = new FlightAgent(type);
      newFlight.createdAt = this.simTime;

      if (type === 'departure') {
        const freeGate = this.gateAgent.gates.find(g => !g.occupied);
        if (freeGate) {
          freeGate.occupied = true;
          freeGate.occupiedBy = newFlight.callsign;
          freeGate.turnaroundTimer = 40 + Math.random() * 80;
          freeGate.turnaroundTotal = freeGate.turnaroundTimer;
          newFlight.x = freeGate.x;
          newFlight.y = freeGate.y;
          newFlight.assignedGate = freeGate;
          this.flights.push(newFlight);
        }
      } else {
        this.flights.push(newFlight);
      }
    }

    // 9. Clean up departed/diverted flights (keep for a while for stats)
    this.flights = this.flights.filter(f => {
      if (f.status === FLIGHT_STATUS.DEPARTED || f.status === FLIGHT_STATUS.DIVERTED) {
        return (this.simTime - (f.departedAt || this.simTime)) < 120;
      }
      return true;
    });

    // 10. Record metrics
    if (this.tickCount % 60 === 0) {
      this._recordMetrics();
    }
  }

  _getBestRunway() {
    const active = this.runwayAgent.runways
      .map((r, i) => ({ ...r, index: i }))
      .filter(r => r.active);
    if (active.length === 0) return null;

    // Pick the one with the shortest queue
    active.sort((a, b) => a.queue.length - b.queue.length);
    return active[0].index;
  }

  _getQueuePosition(flight) {
    for (const runway of this.runwayAgent.runways) {
      const idx = runway.queue.findIndex(q => q.callsign === flight.callsign);
      if (idx >= 0) return idx;
    }
    return 10; // Not in queue
  }

  _addNarration(agentType, action, params) {
    const entry = createNarrationEntry(this.simTime, agentType, action, params);
    this.narrationLog.unshift(entry);
    if (this.narrationLog.length > this.maxNarrations) {
      this.narrationLog.pop();
    }
  }

  _recordMetrics() {
    const activeFlights = this.flights.filter(f => f.isActive());
    const avgDelay = activeFlights.length > 0
      ? activeFlights.reduce((s, f) => s + f.delay, 0) / activeFlights.length
      : 0;
    const avgFuel = activeFlights.length > 0
      ? activeFlights.reduce((s, f) => s + f.fuel, 0) / activeFlights.length
      : 100;

    const runwayStatus = this.runwayAgent.getStatus();
    const gateStatus = this.gateAgent.getStatus();

    this.metricsHistory.delays.push(Math.round(avgDelay));
    this.metricsHistory.fuel.push(Math.round(avgFuel));
    this.metricsHistory.runwayUtil.push(runwayStatus.utilization);
    this.metricsHistory.gateUtil.push(gateStatus.utilization);
    this.metricsHistory.conflicts.push(this.trafficAgent.getStatus().totalConflicts);
    this.metricsHistory.score.push(
      this.coordinator.getEfficiencyScore(
        activeFlights.map(f => f.getData()),
        runwayStatus,
        gateStatus
      )
    );

    const h = Math.floor(this.simTime / 3600) % 24;
    const m = Math.floor((this.simTime % 3600) / 60);
    this.metricsHistory.timestamps.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

    // Keep last 30 data points
    const maxPoints = 30;
    for (const key of Object.keys(this.metricsHistory)) {
      if (this.metricsHistory[key].length > maxPoints) {
        this.metricsHistory[key].shift();
      }
    }
  }

  updateLiveFlights(liveFlights) {
    if (this.trafficMode !== 'LIVE_IGI') return;

    for (const realFlight of liveFlights) {
      const exists = this.flights.some(f => f.callsign === realFlight.callsign);
      if (!exists) {
        const newFlight = new FlightAgent(realFlight.type);
        newFlight.createdAt = this.simTime;
        newFlight.initRealFlight(realFlight, this.gateAgent.gates);
        this.flights.push(newFlight);
      }
    }
  }

  getSnapshot() {
    const activeFlights = this.flights.filter(f => f.isActive());
    const flightData = this.flights.map(f => f.getData());
    const weatherState = this.weatherAgent.getState();
    const runwayStatus = this.runwayAgent.getStatus();
    const gateStatus = this.gateAgent.getStatus();
    const trafficStatus = this.trafficAgent.getStatus();
    const coordStatus = this.coordinator.getStatus();

    return {
      simTime: this.simTime,
      tickCount: this.tickCount,
      speed: this.speed,
      running: this.running,
      scenarioId: this.scenarioId,
      scenarioName: (() => {
        const labelArr = [];
        if (this.trafficMode === 'RUSH_HOUR') labelArr.push('Rush Hour 🔥');
        else if (this.trafficMode === 'LIVE_IGI') labelArr.push('Live IGI Space 📡');
        else labelArr.push('Normal ✈️');
        if (this.weatherMode === 'STORM') labelArr.push('Thunderstorm ⛈️');
        else labelArr.push('Clear ☀️');
        if (this.closedRunways && this.closedRunways.length > 0) {
          labelArr.push(`${this.closedRunways.length} Closed 🚧`);
        }
        return labelArr.join(' + ');
      })(),

      flights: flightData,
      activeFlightCount: activeFlights.length,

      weather: weatherState,
      runway: runwayStatus,
      gate: gateStatus,
      traffic: trafficStatus,
      coordinator: coordStatus,

      narrationLog: this.narrationLog.slice(0, 50),
      metricsHistory: { ...this.metricsHistory },

      efficiencyScore: this.coordinator.getEfficiencyScore(
        activeFlights.map(f => f.getData()),
        runwayStatus,
        gateStatus
      ),
      flightQStats: sharedDQN.getStats(),
    };
  }
}
