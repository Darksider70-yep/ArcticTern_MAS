// ArcticTern ATC — Traffic Agent
// Airspace monitoring, conflict detection, and congestion analysis

import { getMinSeparation } from '../Airport.js';

export class TrafficAgent {
  constructor() {
    this.conflicts = [];
    this.totalConflicts = 0;
    this.separationViolations = 0;
    this.congestionLevel = 0; // 0-100
    this.lastAction = 'SAFE';
    this.lastDecision = {};
    this.sectors = {
      NW: { count: 0 }, NE: { count: 0 },
      SW: { count: 0 }, SE: { count: 0 },
    };
  }

  tick(flights) {
    this.conflicts = [];
    this.sectors = {
      NW: { count: 0 }, NE: { count: 0 },
      SW: { count: 0 }, SE: { count: 0 },
    };

    const airborne = flights.filter(f =>
      f.status === 'APPROACHING' || f.status === 'HOLDING' ||
      f.status === 'DEPARTING' || f.status === 'GO_AROUND'
    );

    // Count aircraft per sector
    for (const f of airborne) {
      const sectorX = f.x < 500 ? 'W' : 'E';
      const sectorY = f.y < 350 ? 'N' : 'S';
      const sector = `N${sectorX}`.replace('NE', 'NE').replace('NW', 'NW')
        .replace(/^N/, sectorY === 'N' ? 'N' : 'S');
      const key = `${sectorY}${sectorX}`;
      if (this.sectors[key]) this.sectors[key].count++;
    }

    // Check all pairs for separation violations
    for (let i = 0; i < airborne.length; i++) {
      for (let j = i + 1; j < airborne.length; j++) {
        const a = airborne[i];
        const b = airborne[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minSep = getMinSeparation(
          a.separationClass || 'MEDIUM',
          b.separationClass || 'MEDIUM'
        );

        if (distance < minSep) {
          this.conflicts.push({
            callsign1: a.callsign,
            callsign2: b.callsign,
            distance: Math.round(distance),
            minSeparation: minSep,
            severity: distance < minSep * 0.5 ? 'CRITICAL' : 'WARNING',
          });
          this.totalConflicts++;
          if (distance < minSep * 0.7) {
            this.separationViolations++;
          }
        }
      }
    }

    // Calculate congestion level
    const maxCapacity = 30;
    this.congestionLevel = Math.min(100, Math.round((airborne.length / maxCapacity) * 100));

    // Determine action
    if (this.conflicts.length > 0) {
      const critical = this.conflicts.find(c => c.severity === 'CRITICAL');
      if (critical) {
        this.lastAction = 'CONFLICT_DETECTED';
        this.lastDecision = {
          callsign1: critical.callsign1,
          callsign2: critical.callsign2,
          distance: critical.distance,
          count: this.conflicts.length,
          sector: this._getCongestedSector(),
        };
      } else {
        this.lastAction = 'CONFLICT_DETECTED';
        this.lastDecision = {
          callsign1: this.conflicts[0].callsign1,
          callsign2: this.conflicts[0].callsign2,
          distance: this.conflicts[0].distance,
          count: this.conflicts.length,
        };
      }
    } else if (this.congestionLevel > 70) {
      this.lastAction = 'CONGESTION';
      this.lastDecision = {
        count: airborne.length,
        sector: this._getCongestedSector(),
      };
    } else {
      this.lastAction = 'SAFE';
      this.lastDecision = { count: airborne.length };
    }

    return this.conflicts;
  }

  _getCongestedSector() {
    let maxSector = 'NW';
    let maxCount = 0;
    for (const [key, val] of Object.entries(this.sectors)) {
      if (val.count > maxCount) {
        maxCount = val.count;
        maxSector = key;
      }
    }
    return maxSector;
  }

  getStatus() {
    return {
      conflicts: this.conflicts,
      totalConflicts: this.totalConflicts,
      separationViolations: this.separationViolations,
      congestionLevel: this.congestionLevel,
      sectors: { ...this.sectors },
      lastAction: this.lastAction,
      lastDecision: this.lastDecision,
    };
  }
}
