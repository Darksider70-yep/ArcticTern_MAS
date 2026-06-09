// ArcticTern ATC — Central Coordinator Agent
// Resolves conflicts, maintains global schedule, computes system-wide reward

export class Coordinator {
  constructor() {
    this.lastAction = 'ALL_CLEAR';
    this.lastDecision = {};
    this.globalReward = 0;
    this.totalRewards = [];
    this.conflictsResolved = 0;
    this.scheduleUpdates = 0;
    this.weatherProtocolActive = false;
  }

  tick(flights, weatherState, trafficStatus, runwayStatus, gateStatus) {
    const conflicts = trafficStatus.conflicts || [];
    const arrivals = flights.filter(f => f.status === 'APPROACHING' || f.status === 'HOLDING').length;
    const departures = flights.filter(f => f.status === 'TAXIING_TO_RUNWAY' || f.status === 'DEPARTING').length;

    // Compute global reward: R = -(D + F + C)
    const totalDelay = flights.reduce((sum, f) => sum + (f.delay || 0), 0);
    const totalFuelBurn = flights.reduce((sum, f) => sum + (100 - (f.fuel || 100)), 0);
    const conflictPenalty = conflicts.length * 50;

    const D = totalDelay * 0.1;
    const F = totalFuelBurn * 0.05;
    const C = conflictPenalty;
    this.globalReward = -(D + F + C);
    this.totalRewards.push(this.globalReward);
    if (this.totalRewards.length > 100) this.totalRewards.shift();

    // Handle conflicts
    if (conflicts.length > 0) {
      this.lastAction = 'RESOLVE_CONFLICT';
      const conflict = conflicts[0];

      // Resolution strategy: instruct one aircraft to hold
      const actions = [];
      for (const c of conflicts) {
        actions.push(`${c.callsign2} hold, ${c.callsign1} proceed`);
        this.conflictsResolved++;
      }

      this.lastDecision = {
        callsign1: conflict.callsign1,
        callsign2: conflict.callsign2,
        action: actions[0],
        margin: Math.round(conflict.distance * 0.1 * 10) / 10,
      };

      return {
        type: 'RESOLVE_CONFLICT',
        holdFlights: conflicts.map(c => c.callsign2),
        proceedFlights: conflicts.map(c => c.callsign1),
      };
    }

    // Handle weather
    if (weatherState.state === 'STORM' && !this.weatherProtocolActive) {
      this.weatherProtocolActive = true;
      this.lastAction = 'WEATHER_RESPONSE';
      this.lastDecision = {
        action: 'Reducing landing rate. Increasing separation. Preparing diversions for low-fuel aircraft.',
      };
      return { type: 'WEATHER_PROTOCOL', active: true };
    }

    if (weatherState.state === 'CLEAR' && this.weatherProtocolActive) {
      this.weatherProtocolActive = false;
      this.lastAction = 'WEATHER_RESPONSE';
      this.lastDecision = {
        action: 'Weather cleared. Resuming normal operations. Processing backlog.',
      };
      return { type: 'WEATHER_PROTOCOL', active: false };
    }

    // Normal schedule update
    this.scheduleUpdates++;
    this.lastAction = 'ALL_CLEAR';
    this.lastDecision = {
      arrivals,
      departures,
      score: this.getEfficiencyScore(flights, runwayStatus, gateStatus),
      reward: Math.round(this.globalReward * 10) / 10,
    };

    return { type: 'SCHEDULE_UPDATE' };
  }

  getEfficiencyScore(flights, runwayStatus, gateStatus) {
    if (!flights || flights.length === 0) return 50;

    const activeFlights = flights.filter(f =>
      f.status !== 'DEPARTED' && f.status !== 'DIVERTED'
    );
    if (activeFlights.length === 0) return 85;

    // Delay score (lower delay = higher score)
    const avgDelay = activeFlights.reduce((s, f) => s + (f.delay || 0), 0) / activeFlights.length;
    const delayScore = Math.max(0, 100 - avgDelay * 2);

    // Fuel efficiency score
    const avgFuel = activeFlights.reduce((s, f) => s + (f.fuel || 50), 0) / activeFlights.length;
    const fuelScore = avgFuel;

    // Resource utilization
    const runwayUtil = runwayStatus?.utilization || 50;
    const gateUtil = gateStatus?.utilization || 50;
    const utilScore = (runwayUtil + gateUtil) / 2;

    // Safety score (fewer conflicts = higher)
    const safetyScore = Math.max(0, 100 - (this.conflictsResolved % 10) * 10);

    // Weighted average
    const score = (delayScore * 0.3 + fuelScore * 0.2 + utilScore * 0.25 + safetyScore * 0.25);
    return Math.round(Math.min(100, Math.max(0, score)));
  }

  getAverageReward() {
    if (this.totalRewards.length === 0) return 0;
    return this.totalRewards.reduce((a, b) => a + b, 0) / this.totalRewards.length;
  }

  getStatus() {
    return {
      lastAction: this.lastAction,
      lastDecision: this.lastDecision,
      globalReward: Math.round(this.globalReward * 100) / 100,
      averageReward: Math.round(this.getAverageReward() * 100) / 100,
      conflictsResolved: this.conflictsResolved,
      scheduleUpdates: this.scheduleUpdates,
      weatherProtocolActive: this.weatherProtocolActive,
    };
  }
}
