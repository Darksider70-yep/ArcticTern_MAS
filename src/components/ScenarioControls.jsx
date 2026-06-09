// ArcticTern ATC — Scenario Controls
// Independent toggles for traffic mode, weather condition, and runway status

export default function ScenarioControls({
  trafficMode,
  weatherMode,
  closedRunways,
  speed,
  running,
  onTrafficToggle,
  onWeatherToggle,
  onClosedRunwayToggle,
  onSpeedChange,
  onTogglePlay,
  onReset,
}) {
  return (
    <div className="scenario-controls" id="scenario-controls">
      {/* Simulation Situation Toggles */}
      <div className="scenario-presets" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* 1. Traffic Toggle */}
        <button
          className={`scenario-btn ${trafficMode === 'RUSH_HOUR' ? 'scenario-btn-active' : ''}`}
          onClick={onTrafficToggle}
          id="btn-toggle-traffic"
          title="Toggle Peak Rush Hour Traffic"
          style={{
            borderColor: trafficMode === 'RUSH_HOUR' ? '#ef4444' : 'var(--glass-border)',
            color: trafficMode === 'RUSH_HOUR' ? '#ef4444' : 'var(--text-secondary)',
            boxShadow: trafficMode === 'RUSH_HOUR' ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none',
          }}
        >
          <span className="scenario-icon">{trafficMode === 'RUSH_HOUR' ? '🔥' : '✈️'}</span>
          <span className="scenario-name">{trafficMode === 'RUSH_HOUR' ? 'Rush Hour' : 'Normal Traffic'}</span>
        </button>

        {/* 2. Weather Toggle */}
        <button
          className={`scenario-btn ${weatherMode === 'STORM' ? 'scenario-btn-active' : ''}`}
          onClick={onWeatherToggle}
          id="btn-toggle-weather"
          title="Toggle Severe Storm Weather"
          style={{
            borderColor: weatherMode === 'STORM' ? '#f97316' : 'var(--glass-border)',
            color: weatherMode === 'STORM' ? '#f97316' : 'var(--text-secondary)',
            boxShadow: weatherMode === 'STORM' ? '0 0 10px rgba(249, 115, 22, 0.2)' : 'none',
          }}
        >
          <span className="scenario-icon">{weatherMode === 'STORM' ? '⛈️' : '☀️'}</span>
          <span className="scenario-name">{weatherMode === 'STORM' ? 'Thunderstorm' : 'Clear Weather'}</span>
        </button>

        {/* 3. Runway Closures Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '10px', marginLeft: '4px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', marginRight: '4px' }}>RUNWAYS:</span>
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
