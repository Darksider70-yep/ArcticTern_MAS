// ArcticTern ATC — Scenario Controls
// Preset buttons, speed slider, play/pause/reset

import { getScenarioList } from '../engine/Scenarios.js';

export default function ScenarioControls({
  currentScenario,
  speed,
  running,
  onScenarioChange,
  onSpeedChange,
  onTogglePlay,
  onReset,
  closedRunwayIndex,
  onClosedRunwayChange,
}) {
  const scenarios = getScenarioList();

  return (
    <div className="scenario-controls" id="scenario-controls">
      {/* Scenario Presets */}
      <div className="scenario-presets" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {scenarios.map(sc => {
          const isActive = currentScenario === sc.id;
          return (
            <div key={sc.id} className="scenario-btn-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className={`scenario-btn ${isActive ? 'scenario-btn-active' : ''}`}
                onClick={() => onScenarioChange(sc.id)}
                title={sc.description}
                id={`scenario-${sc.id.toLowerCase()}`}
              >
                <span className="scenario-icon">{sc.icon}</span>
                <span className="scenario-name">{sc.name}</span>
              </button>

              {sc.id === 'RUNWAY_CLOSURE' && isActive && (
                <select
                  value={closedRunwayIndex}
                  onChange={(e) => onClosedRunwayChange(parseInt(e.target.value))}
                  className="runway-select-dropdown"
                  style={{
                    background: 'rgba(10, 15, 28, 0.95)',
                    border: '1px solid var(--color-runway)',
                    borderRadius: '4px',
                    color: 'var(--text-accent)',
                    fontSize: '11px',
                    padding: '4px 8px',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    outline: 'none',
                    height: '28px',
                    boxShadow: '0 0 8px rgba(59, 130, 246, 0.15)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <option value={0}>Close Runway 09/27</option>
                  <option value={1}>Close Runway 10/28</option>
                  <option value={2}>Close Runway 11L/29R</option>
                  <option value={3}>Close Runway 11R/29L</option>
                </select>
              )}
            </div>
          );
        })}
      </div>

      {/* Playback Controls */}
      <div className="playback-controls">
        <button
          className="control-btn"
          onClick={onTogglePlay}
          id="btn-play-pause"
          title={running ? 'Pause' : 'Play'}
        >
          {running ? '⏸' : '▶️'}
        </button>
        <button
          className="control-btn"
          onClick={onReset}
          id="btn-reset"
          title="Reset"
        >
          ↺
        </button>

        {/* Speed Slider */}
        <div className="speed-control">
          <span className="speed-label">Speed:</span>
          <div className="speed-buttons">
            {[1, 5, 10].map(s => (
              <button
                key={s}
                className={`speed-btn ${speed === s ? 'speed-btn-active' : ''}`}
                onClick={() => onSpeedChange(s)}
                id={`speed-${s}x`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
