// ArcticTern ATC — Main App
// Assembles all components and manages the SimEngine lifecycle

import { useRef, useState, useEffect, useCallback } from 'react';
import { SimEngine } from './engine/SimEngine.js';
import Navbar from './components/Navbar.jsx';
import AirportCanvas from './components/AirportCanvas.jsx';
import AgentDashboard from './components/AgentDashboard.jsx';
import AgentThinkingFeed from './components/AgentThinkingFeed.jsx';
import MetricsPanel from './components/MetricsPanel.jsx';
import ScoreOverlay from './components/ScoreOverlay.jsx';
import ScenarioControls from './components/ScenarioControls.jsx';

export default function App() {
  const engineRef = useRef(null);
  const [snapshot, setSnapshot] = useState(null);
  const [currentScenario, setCurrentScenario] = useState('NORMAL');
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [closedRunways, setClosedRunways] = useState([1]); // Default to close 10/28 (index 1)

  // Initialize engine (handles StrictMode double-mount)
  useEffect(() => {
    if (engineRef.current) return; // Already initialized

    const engine = new SimEngine();
    engineRef.current = engine;

    // Subscribe to updates
    engine.on('update', (snap) => {
      setSnapshot(snap);
    });

    // Get initial snapshot
    setSnapshot(engine.getSnapshot());

    // Auto-start after a brief delay
    const timer = setTimeout(() => {
      engine.start();
      setRunning(true);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleScenarioChange = useCallback((scenarioId, customClosedRunways = null) => {
    const engine = engineRef.current;
    if (!engine) return;

    const targetClosedRunways = customClosedRunways !== null ? customClosedRunways : closedRunways;

    engine.pause();
    engine.reset(scenarioId, {
      closedRunways: scenarioId === 'RUNWAY_CLOSURE' ? targetClosedRunways : []
    });
    setCurrentScenario(scenarioId);
    setSnapshot(engine.getSnapshot());

    // Restart
    setTimeout(() => {
      engine.start();
      setRunning(true);
    }, 100);
  }, [closedRunways]);

  const handleClosedRunwayToggle = useCallback((index) => {
    setClosedRunways(prev => {
      const next = prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index];
      handleScenarioChange('RUNWAY_CLOSURE', next);
      return next;
    });
  }, [handleScenarioChange]);

  const handleSpeedChange = useCallback((newSpeed) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setSpeed(newSpeed);
    setSpeed(newSpeed);
  }, []);

  const handleTogglePlay = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.running) {
      engine.pause();
      setRunning(false);
    } else {
      engine.start();
      setRunning(true);
    }
  }, []);

  const handleReset = useCallback(() => {
    handleScenarioChange(currentScenario);
  }, [currentScenario, handleScenarioChange]);

  return (
    <div className="app" id="app-root">
      <Navbar snapshot={snapshot} />

      <main className="main-layout">
        {/* Left Sidebar: Dashboard Panels */}
        <aside className="dashboard-section sidebar-left">
          <AgentDashboard snapshot={snapshot} />
          <MetricsPanel snapshot={snapshot} />
        </aside>

        {/* Center: Airport Canvas + Score */}
        <section className="canvas-section">
          <div className="canvas-wrapper">
            <AirportCanvas snapshot={snapshot} />
            <ScoreOverlay score={snapshot?.efficiencyScore || 50} />
          </div>

          {/* Scenario Controls */}
          <ScenarioControls
            currentScenario={currentScenario}
            speed={speed}
            running={running}
            onScenarioChange={handleScenarioChange}
            onSpeedChange={handleSpeedChange}
            onTogglePlay={handleTogglePlay}
            onReset={handleReset}
            closedRunways={closedRunways}
            onClosedRunwayToggle={handleClosedRunwayToggle}
          />
        </section>

        {/* Right Sidebar: Thinking Feed */}
        <aside className="dashboard-section sidebar-right">
          <AgentThinkingFeed narrationLog={snapshot?.narrationLog} />
        </aside>
      </main>
    </div>
  );
}
