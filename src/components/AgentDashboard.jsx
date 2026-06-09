// ArcticTern ATC — Agent Dashboard
// Live status cards for all 6 agent types

import { COLORS, AGENT_ICONS } from '../utils/colors.js';

const AGENT_CONFIGS = [
  { key: 'weather', name: 'Weather Agent', color: COLORS.agentWeather },
  { key: 'runway', name: 'Runway Agent', color: COLORS.agentRunway },
  { key: 'gate', name: 'Gate Agent', color: COLORS.agentGate },
  { key: 'traffic', name: 'Traffic Agent', color: COLORS.agentTraffic },
  { key: 'coordinator', name: 'Coordinator', color: COLORS.agentCoordinator },
  { key: 'flight', name: 'Flight Agents', color: COLORS.agentFlight },
];

export default function AgentDashboard({ snapshot }) {
  if (!snapshot) return null;

  return (
    <div className="agent-dashboard" id="agent-dashboard">
      <h3 className="panel-title">Agent Status</h3>
      <div className="agent-grid">
        {AGENT_CONFIGS.map(agent => (
          <AgentCard
            key={agent.key}
            agent={agent}
            snapshot={snapshot}
          />
        ))}
      </div>
    </div>
  );
}

function AgentCard({ agent, snapshot }) {
  const { key, name, color } = agent;
  const icon = AGENT_ICONS[key];
  const data = getAgentData(key, snapshot);

  const isActive = data.action && data.action !== 'HOLD' && data.action !== 'SAFE' && data.action !== 'ALL_CLEAR';

  return (
    <div
      className={`agent-card ${isActive ? 'agent-card-active' : ''}`}
      style={{ borderColor: color + '40', '--agent-color': color }}
      id={`agent-card-${key}`}
    >
      <div className="agent-card-header">
        <span className="agent-icon">{icon}</span>
        <span className="agent-name">{name}</span>
        <span
          className={`agent-status-dot ${isActive ? 'agent-status-active' : 'agent-status-idle'}`}
          style={{ backgroundColor: isActive ? color : COLORS.textMuted }}
        />
      </div>
      <div className="agent-card-body">
        <div className="agent-metric">
          <span className="agent-metric-label">{data.primaryLabel}</span>
          <span className="agent-metric-value" style={{ color }}>
            {data.primaryValue}
          </span>
        </div>
        <div className="agent-metric">
          <span className="agent-metric-label">{data.secondaryLabel}</span>
          <span className="agent-metric-value">{data.secondaryValue}</span>
        </div>
        <div className="agent-action-tag" style={{ backgroundColor: color + '20', color }}>
          {data.action || 'Idle'}
        </div>
      </div>
    </div>
  );
}

function getAgentData(key, snapshot) {
  switch (key) {
    case 'weather': {
      const w = snapshot.weather || {};
      const stateEmojis = { CLEAR: '☀️', CLOUDY: '🌥️', STORM: '⛈️', CLEARING: '🌤️' };
      return {
        primaryLabel: 'Conditions',
        primaryValue: `${stateEmojis[w.state] || ''} ${w.state || 'N/A'}`,
        secondaryLabel: 'Wind',
        secondaryValue: `${w.windSpeed || 0}kts ${w.windDirection || ''}`,
        action: w.state,
      };
    }
    case 'runway': {
      const r = snapshot.runway || {};
      return {
        primaryLabel: 'Utilization',
        primaryValue: `${r.utilization || 0}%`,
        secondaryLabel: 'Throughput',
        secondaryValue: `${r.throughput || 0} ops`,
        action: r.lastAction,
      };
    }
    case 'gate': {
      const g = snapshot.gate || {};
      return {
        primaryLabel: 'Utilization',
        primaryValue: `${g.utilization || 0}%`,
        secondaryLabel: 'Waiting',
        secondaryValue: `${g.waitingCount || 0} aircraft`,
        action: g.lastAction,
      };
    }
    case 'traffic': {
      const t = snapshot.traffic || {};
      return {
        primaryLabel: 'Congestion',
        primaryValue: `${t.congestionLevel || 0}%`,
        secondaryLabel: 'Conflicts',
        secondaryValue: `${(t.conflicts || []).length} active`,
        action: t.lastAction,
      };
    }
    case 'coordinator': {
      const c = snapshot.coordinator || {};
      return {
        primaryLabel: 'Global Reward',
        primaryValue: `${c.globalReward || 0}`,
        secondaryLabel: 'Resolved',
        secondaryValue: `${c.conflictsResolved || 0} conflicts`,
        action: c.lastAction,
      };
    }
    case 'flight': {
      return {
        primaryLabel: 'Active',
        primaryValue: `${snapshot.activeFlightCount || 0} ✈️`,
        secondaryLabel: 'Status',
        secondaryValue: getFlightSummary(snapshot.flights),
        action: snapshot.activeFlightCount > 0 ? 'ACTIVE' : 'IDLE',
      };
    }
    default:
      return { primaryLabel: '', primaryValue: '', secondaryLabel: '', secondaryValue: '', action: '' };
  }
}

function getFlightSummary(flights) {
  if (!flights || flights.length === 0) return 'None';
  const approaching = flights.filter(f => f.status === 'APPROACHING' || f.status === 'HOLDING').length;
  const parked = flights.filter(f => f.status === 'PARKED').length;
  return `${approaching} inbound, ${parked} parked`;
}
