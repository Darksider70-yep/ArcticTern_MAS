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
        {/* 1. Traffic Options */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`scenario-btn ${trafficMode === 'NORMAL' ? 'scenario-btn-active' : ''}`}
            onClick={() => onTrafficToggle('NORMAL')}
            id="btn-traffic-normal"
            title="Switch to Normal Operations Traffic"
            style={{
              borderColor: trafficMode === 'NORMAL' ? '#3b82f6' : 'var(--glass-border)',
              color: trafficMode === 'NORMAL' ? '#3b82f6' : 'var(--text-secondary)',
              boxShadow: trafficMode === 'NORMAL' ? '0 0 8px rgba(59, 130, 246, 0.2)' : 'none',
              background: trafficMode === 'NORMAL' ? 'rgba(59, 130, 246, 0.08)' : 'var(--glass-bg)',
            }}
          >
            <span className="scenario-icon">✈️</span>
            <span className="scenario-name">Normal Ops</span>
          </button>

          <button
            className={`scenario-btn ${trafficMode === 'RUSH_HOUR' ? 'scenario-btn-active' : ''}`}
            onClick={() => onTrafficToggle('RUSH_HOUR')}
            id="btn-traffic-rush"
            title="Switch to Peak Rush Hour Traffic"
            style={{
              borderColor: trafficMode === 'RUSH_HOUR' ? '#ef4444' : 'var(--glass-border)',
              color: trafficMode === 'RUSH_HOUR' ? '#ef4444' : 'var(--text-secondary)',
              boxShadow: trafficMode === 'RUSH_HOUR' ? '0 0 8px rgba(239, 68, 68, 0.2)' : 'none',
              background: trafficMode === 'RUSH_HOUR' ? 'rgba(239, 68, 68, 0.08)' : 'var(--glass-bg)',
            }}
          >
            <span className="scenario-icon">🔥</span>
            <span className="scenario-name">Rush Hour</span>
          </button>

          <button
            className={`scenario-btn ${trafficMode === 'LIVE_IGI' ? 'scenario-btn-active' : ''}`}
            onClick={() => onTrafficToggle('LIVE_IGI')}
            id="btn-traffic-live"
            title="Fetch and Simulate Live IGI Airspace (OpenSky API)"
            style={{
              borderColor: trafficMode === 'LIVE_IGI' ? '#a855f7' : 'var(--glass-border)',
              color: trafficMode === 'LIVE_IGI' ? '#a855f7' : 'var(--text-secondary)',
              boxShadow: trafficMode === 'LIVE_IGI' ? '0 0 8px rgba(168, 85, 247, 0.2)' : 'none',
              background: trafficMode === 'LIVE_IGI' ? 'rgba(168, 85, 247, 0.08)' : 'var(--glass-bg)',
            }}
          >
            <span className="scenario-icon">📡</span>
            <span className="scenario-name">Live IGI</span>
          </button>
        </div>

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
