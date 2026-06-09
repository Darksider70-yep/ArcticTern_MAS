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
  closedRunways,
  onClosedRunwayToggle,
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
                <div
                  className="runways-multiselect"
                  style={{
                    display: 'flex',
                    gap: '4px',
                    marginLeft: '4px',
                    alignItems: 'center',
                  }}
                >
                  {[
                    { idx: 0, label: '09/27' },
                    { idx: 1, label: '10/28' },
                    { idx: 2, label: '11L/29R' },
                    { idx: 3, label: '11R/29L' },
                  ].map(r => {
                    const isClosed = closedRunways.includes(r.idx);
                    return (
                      <button
                        key={r.idx}
                        onClick={() => onClosedRunwayToggle(r.idx)}
                        className={`runway-toggle-btn ${isClosed ? 'closed' : 'open'}`}
                        style={{
                          background: isClosed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                          border: isClosed ? '1px solid #ef4444' : '1px solid #10b981',
                          borderRadius: '4px',
                          color: isClosed ? '#ef4444' : '#10b981',
                          fontSize: '10px',
                          padding: '3px 6px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          cursor: 'pointer',
                          outline: 'none',
                          boxShadow: isClosed ? '0 0 6px rgba(239, 68, 68, 0.15)' : 'none',
                          transition: 'all 0.15s ease',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                        title={isClosed ? `Runway ${r.label} closed. Click to open.` : `Runway ${r.label} open. Click to close.`}
                      >
                        <span>{r.label}</span>
                        <span>{isClosed ? '❌' : '✅'}</span>
                      </button>
                    );
                  })}
                </div>
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
