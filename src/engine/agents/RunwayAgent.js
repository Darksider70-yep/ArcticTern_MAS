// ArcticTern ATC — Runway Agent
// Manages runway sequencing, separation, and utilization using Q-Learning

import { DeepQNetwork } from '../QLearning.js';

const ACTIONS = ['CLEAR_LANDING', 'CLEAR_TAKEOFF', 'HOLD', 'SWITCH_RUNWAY'];

export class RunwayAgent {
  constructor(runways) {
    this.runways = runways.map(r => ({
      ...r,
      occupied: false,
      occupiedBy: null,
      cooldownTimer: 0,
      queue: [],
      totalOps: 0,
    }));
    this.qTable = new DeepQNetwork(ACTIONS, 5, [32, 16], { epsilon: 0.2, alpha: 0.01, gamma: 0.9 });
    this.lastAction = 'HOLD';
    this.lastDecision = {};
    this.totalThroughput = 0;
    this.conflicts = 0;

    // Pre-seed Q-table
    this._preSeed();
  }

  _preSeed() {
    this.qTable.seed([
      // state: [totalQueue, anyOccupied, weatherSeverity, hasDepartures, utilization]
      { state: [0.3, 0.0, 0.1, 0.0, 0.0], action: 'CLEAR_LANDING', targetQ: 0.8 },
      { state: [0.3, 0.0, 0.1, 0.0, 0.0], action: 'HOLD', targetQ: 0.1 },
      
      { state: [0.0, 0.0, 0.1, 1.0, 0.0], action: 'CLEAR_TAKEOFF', targetQ: 0.8 },
      { state: [0.0, 0.0, 0.1, 1.0, 0.0], action: 'HOLD', targetQ: 0.2 },

      { state: [0.5, 1.0, 0.8, 1.0, 0.8], action: 'SWITCH_RUNWAY', targetQ: 0.7 },
      { state: [0.5, 1.0, 0.8, 1.0, 0.8], action: 'HOLD', targetQ: 0.3 },
    ], 30);
  }

  getStateVector(weatherSeverity) {
    const totalQueue = this.runways.reduce((sum, r) => sum + r.queue.length, 0);
    const anyOccupied = this.runways.some(r => r.occupied) ? 1.0 : 0.0;
    const hasDepartures = this.runways.some(r => r.queue.some(f => f.type === 'departure')) ? 1.0 : 0.0;

    return [
      totalQueue / 20.0,
      anyOccupied,
      weatherSeverity / 10.0,
      hasDepartures,
      this.getUtilization() / 100.0,
    ];
  }

  decide(flights, weatherState) {
    const stateVec = this.getStateVector(weatherState.intensity);
    const { action, qValue, wasExploration } = this.qTable.chooseAction(stateVec);

    let reward = 0;
    const decision = { action, qValue, wasExploration };

    switch (action) {
      case 'CLEAR_LANDING': {
        const runwaysWithArrivals = this.runways.filter(
          r => r.active && !r.occupied && r.cooldownTimer <= 0 && r.queue.some(f => f.type === 'arrival')
        );
        if (runwaysWithArrivals.length > 0) {
          runwaysWithArrivals.sort((a, b) => b.queue.length - a.queue.length);
          const runway = runwaysWithArrivals[0];
          const flightIdx = runway.queue.findIndex(f => f.type === 'arrival');
          if (flightIdx >= 0) {
            const flight = runway.queue.splice(flightIdx, 1)[0];
            runway.occupied = true;
            runway.occupiedBy = flight.callsign;
            runway.cooldownTimer = 30; // ticks
            runway.totalOps++;
            this.totalThroughput++;
            reward = 1.0 - (flight.waitTime || 0) * 0.01;
            decision.runway = runway.name;
            decision.callsign = flight.callsign;
            decision.queue = runway.queue.length;
            decision.wait = Math.round((flight.waitTime || 0));
          } else {
            reward = -0.1;
          }
        } else {
          reward = -0.1;
        }
        break;
      }
      case 'CLEAR_TAKEOFF': {
        const runwaysWithDepartures = this.runways.filter(
          r => r.active && !r.occupied && r.cooldownTimer <= 0 && r.queue.some(f => f.type === 'departure')
        );
        if (runwaysWithDepartures.length > 0) {
          runwaysWithDepartures.sort((a, b) => b.queue.length - a.queue.length);
          const runway = runwaysWithDepartures[0];
          const depIdx = runway.queue.findIndex(f => f.type === 'departure');
          if (depIdx >= 0) {
            const depFlight = runway.queue.splice(depIdx, 1)[0];
            runway.occupied = true;
            runway.occupiedBy = depFlight.callsign;
            runway.cooldownTimer = 25;
            runway.totalOps++;
            this.totalThroughput++;
            reward = 0.8 - (depFlight.waitTime || 0) * 0.005;
            decision.runway = runway.name;
            decision.callsign = depFlight.callsign;
            decision.wait = Math.round(depFlight.waitTime || 0);
          } else {
            reward = -0.1;
          }
        } else {
          reward = -0.1;
        }
        break;
      }
      case 'HOLD':
        reward = -0.05 * this.runways.reduce((s, r) => s + r.queue.length, 0);
        break;

      case 'SWITCH_RUNWAY':
        if (weatherState.intensity > 5) {
          // Valid to switch during bad weather
          const inactive = this.runways.find(r => !r.active);
          if (inactive) {
            inactive.active = true;
            reward = 0.3;
            decision.runway = inactive.name;
            decision.reason = 'weather adaptation';
          }
        } else {
          reward = -0.2; // Unnecessary switch
        }
        break;
    }

    // Learn from this step
    const nextStateVec = this.getStateVector(weatherState.intensity);
    this.qTable.learn(stateVec, action, reward, nextStateVec);

    this.lastAction = action;
    this.lastDecision = decision;
    return decision;
  }

  tick() {
    // Update runway cooldowns and occupancy
    for (const runway of this.runways) {
      if (runway.cooldownTimer > 0) {
        runway.cooldownTimer--;
        if (runway.cooldownTimer <= 0) {
          runway.occupied = false;
          runway.occupiedBy = null;
        }
      }
      // Age queue items
      for (const item of runway.queue) {
        item.waitTime = (item.waitTime || 0) + 1;
      }
    }
  }

  addToQueue(runwayIndex, flightInfo) {
    if (runwayIndex < this.runways.length) {
      this.runways[runwayIndex].queue.push({ ...flightInfo, waitTime: 0 });
    }
  }

  getUtilization() {
    const active = this.runways.filter(r => r.active);
    if (active.length === 0) return 0;
    const busyCount = active.filter(r => r.occupied || r.queue.length > 0).length;
    return Math.round((busyCount / active.length) * 100);
  }

  getStatus() {
    return {
      runways: this.runways.map(r => ({
        name: r.name,
        active: r.active,
        occupied: r.occupied,
        occupiedBy: r.occupiedBy,
        queueLength: r.queue.length,
        totalOps: r.totalOps,
      })),
      utilization: this.getUtilization(),
      throughput: this.totalThroughput,
      lastAction: this.lastAction,
      lastDecision: this.lastDecision,
      qStats: this.qTable.getStats(),
    };
  }
}
