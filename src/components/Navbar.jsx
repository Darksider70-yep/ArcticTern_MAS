// ArcticTern ATC — Navbar
// Top bar with logo, sim clock, scenario badge, and status

export default function Navbar({ snapshot }) {
  if (!snapshot) return null;

  const { simTime, scenarioName, running, activeFlightCount } = snapshot;

  // Format sim time
  const hours = Math.floor(simTime / 3600) % 24;
  const minutes = Math.floor((simTime % 3600) / 60);
  const seconds = Math.floor(simTime % 60);
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <nav className="navbar" id="navbar">
      <div className="nav-brand">
        <span className="nav-logo">✈</span>
        <span className="nav-title">ArcticTern</span>
        <span className="nav-subtitle">ATC</span>
      </div>

      <div className="nav-info">
        <div className="nav-clock" id="sim-clock">
          <span className="clock-icon">🕐</span>
          <span className="clock-time">{timeStr}</span>
        </div>

        <div className="nav-badge" id="scenario-badge">
          {scenarioName}
        </div>

        <div className="nav-status">
          <span
            className={`status-dot ${running ? 'status-running' : 'status-paused'}`}
          />
          <span className="status-text">
            {running ? 'Running' : 'Paused'}
          </span>
        </div>

        <div className="nav-flights" id="flight-counter">
          <span className="flights-count">{activeFlightCount}</span>
          <span className="flights-icon">✈</span>
        </div>
      </div>
    </nav>
  );
}
