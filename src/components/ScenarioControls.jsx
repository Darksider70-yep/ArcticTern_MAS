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
}) {
  const scenarios = getScenarioList();

  return (
    <div className="scenario-controls" id="scenario-controls">
      {/* Scenario Presets */}
      <div className="scenario-presets">
        {scenarios.map(sc => (
          <button
            key={sc.id}
            className={`scenario-btn ${currentScenario === sc.id ? 'scenario-btn-active' : ''}`}
            onClick={() => onScenarioChange(sc.id)}
            title={sc.description}
            id={`scenario-${sc.id.toLowerCase()}`}
          >
            <span className="scenario-icon">{sc.icon}</span>
            <span className="scenario-name">{sc.name}</span>
          </button>
        ))}
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
