// ArcticTern ATC — Gate Agent
// Handles gate allocation and turnaround management using Q-Learning

import { QTable, discretize, makeStateKey } from '../QLearning.js';
import { GATES } from '../Airport.js';

const ACTIONS = ['ASSIGN_GATE', 'REASSIGN', 'HOLD_TAXIWAY', 'RELEASE'];

export class GateAgent {
  constructor() {
    this.gates = GATES.map(g => ({
      ...g,
      occupied: false,
      occupiedBy: null,
      turnaroundTimer: 0,
      turnaroundTotal: 0,
    }));
    this.qTable = new QTable(ACTIONS, { epsilon: 0.2, alpha: 0.1, gamma: 0.9 });
    this.waitingQueue = [];
    this.lastAction = 'HOLD_TAXIWAY';
    this.lastDecision = {};
    this.totalAssignments = 0;
    this.totalWaitTime = 0;

    this._preSeed();
  }

  _preSeed() {
    this.qTable.seed({
      '0_1_0': { ASSIGN_GATE: 0.9, HOLD_TAXIWAY: 0.1, REASSIGN: -0.1, RELEASE: -0.2 },
      '0_0_0': { HOLD_TAXIWAY: 0.3, ASSIGN_GATE: 0.1, RELEASE: -0.1, REASSIGN: -0.1 },
      '1_1_0': { ASSIGN_GATE: 0.7, HOLD_TAXIWAY: 0.3, REASSIGN: 0.2, RELEASE: -0.1 },
      '2_1_0': { ASSIGN_GATE: 0.5, REASSIGN: 0.4, HOLD_TAXIWAY: 0.3, RELEASE: -0.1 },
      '2_0_0': { HOLD_TAXIWAY: 0.5, REASSIGN: 0.3, ASSIGN_GATE: -0.2, RELEASE: -0.1 },
    });
  }

  getState() {
    const freeGates = this.gates.filter(g => !g.occupied).length;
    const pendingArrivals = this.waitingQueue.length;
    const hasReadyRelease = this.gates.some(g => g.occupied && g.turnaroundTimer <= 0) ? 1 : 0;

    return makeStateKey(
      discretize(freeGates, [1, 3, 5]),
      discretize(pendingArrivals, [1, 3]),
      hasReadyRelease
    );
  }

  decide() {
    const state = this.getState();
    const { action, qValue, wasExploration } = this.qTable.chooseAction(state);

    let reward = 0;
    const decision = { action, qValue, wasExploration };

    switch (action) {
      case 'ASSIGN_GATE': {
        const waiting = this.waitingQueue.shift();
        if (waiting) {
          const callsign = waiting.callsign || '';
          const prefix = callsign.slice(0, 2);
          const isLCC = ['6E', 'SG', 'QP'].includes(prefix);
          
          let freeGate = this.gates.find(g => !g.occupied && (isLCC ? (g.id.startsWith('T1') || g.id.startsWith('T2')) : g.id.startsWith('T3')));
          if (!freeGate) {
            freeGate = this.gates.find(g => !g.occupied);
          }

          if (freeGate) {
            freeGate.occupied = true;
            freeGate.occupiedBy = waiting.callsign;
            freeGate.turnaroundTimer = 60 + Math.random() * 120; // 60-180 ticks
            freeGate.turnaroundTotal = freeGate.turnaroundTimer;
            this.totalAssignments++;
            reward = 0.8 - (waiting.waitTime || 0) * 0.005;
            decision.gateId = freeGate.id;
            decision.callsign = waiting.callsign;
            decision.turnaround = Math.round(freeGate.turnaroundTimer / 60);
            decision.util = this.getUtilization();
          } else {
            // Re-queue
            this.waitingQueue.unshift(waiting);
            reward = -0.2;
          }
        } else {
          reward = -0.2;
        }
        break;
      }
      case 'REASSIGN': {
        // Move longest-waiting from full gate area to emptier one
        const nearlyDone = this.gates.find(g => g.occupied && g.turnaroundTimer < 10);
        if (nearlyDone && this.waitingQueue.length > 0) {
          reward = 0.3;
          decision.reason = 'optimizing turnaround';
        } else {
          reward = -0.1;
        }
        break;
      }
      case 'HOLD_TAXIWAY':
        reward = -0.02 * this.waitingQueue.length;
        decision.pending = this.waitingQueue.length;
        break;
      case 'RELEASE': {
        const ready = this.gates.find(g => g.occupied && g.turnaroundTimer <= 0);
        if (ready) {
          decision.gateId = ready.id;
          decision.callsign = ready.occupiedBy;
          reward = 0.5;
        } else {
          reward = -0.1;
        }
        break;
      }
    }

    const nextState = this.getState();
    this.qTable.learn(state, action, reward, nextState);

    this.lastAction = action;
    this.lastDecision = decision;
    return decision;
  }

  tick() {
    // Update turnaround timers
    for (const gate of this.gates) {
      if (gate.occupied && gate.turnaroundTimer > 0) {
        gate.turnaroundTimer--;
      }
    }
    // Age waiting queue
    for (const item of this.waitingQueue) {
      item.waitTime = (item.waitTime || 0) + 1;
      this.totalWaitTime++;
    }
  }

  requestGate(flightInfo) {
    this.waitingQueue.push({ ...flightInfo, waitTime: 0 });
  }

  findGateForFlight(callsign) {
    return this.gates.find(g => g.occupiedBy === callsign);
  }

  getUtilization() {
    const occupied = this.gates.filter(g => g.occupied).length;
    return Math.round((occupied / this.gates.length) * 100);
  }

  getStatus() {
    return {
      gates: this.gates.map(g => ({
        id: g.id,
        occupied: g.occupied,
        occupiedBy: g.occupiedBy,
        turnaroundRemaining: Math.round(g.turnaroundTimer),
        turnaroundTotal: Math.round(g.turnaroundTotal),
      })),
      utilization: this.getUtilization(),
      waitingCount: this.waitingQueue.length,
      totalAssignments: this.totalAssignments,
      lastAction: this.lastAction,
      lastDecision: this.lastDecision,
      qStats: this.qTable.getStats(),
    };
  }
}
