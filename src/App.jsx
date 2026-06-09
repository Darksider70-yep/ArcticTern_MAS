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
import { fetchIGIFlights } from './utils/flightApi.js';

export default function App() {
  const engineRef = useRef(null);
  const [snapshot, setSnapshot] = useState(null);
  const [trafficMode, setTrafficMode] = useState('NORMAL'); // 'NORMAL' or 'RUSH_HOUR'
  const [weatherMode, setWeatherMode] = useState('CLEAR');  // 'CLEAR' or 'STORM'
  const [closedRunways, setClosedRunways] = useState([]);   // Array of closed indices
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);

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

  // Poll live flights when in LIVE_IGI traffic mode
  useEffect(() => {
    if (trafficMode !== 'LIVE_IGI' || !running) return;

    const fetchAndLoad = async () => {
      const engine = engineRef.current;
      if (!engine) return;

      try {
        engine._addNarration('coordinator', 'LIVE_API_FETCH', {
          msg: 'Connecting to OpenSky IGI Live feed...'
        });
        
        const { flights, source } = await fetchIGIFlights();
        engine.updateLiveFlights(flights);
        
        const count = flights.length;
        if (source === 'live') {
          engine._addNarration('coordinator', 'LIVE_API_SUCCESS', {
            msg: `Loaded ${count} active flights from live radar API`
          });
        } else {
          engine._addNarration('coordinator', 'LIVE_API_FALLBACK', {
            msg: `Offline/Rate-limit: Loaded ${count} peak-hour DEL flights`
          });
        }
      } catch (err) {
        console.error("Error fetching live flight data:", err);
      }
    };

    fetchAndLoad();
    const interval = setInterval(fetchAndLoad, 10000);
    return () => clearInterval(interval);
  }, [trafficMode, running]);

  const updateSimConfig = useCallback((newTraffic, newWeather, newClosedRunways) => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.pause();
    engine.reset({
      traffic: newTraffic,
      weather: newWeather,
      closedRunways: newClosedRunways
    });
    
    setTrafficMode(newTraffic);
    setWeatherMode(newWeather);
    setClosedRunways(newClosedRunways);
    setSnapshot(engine.getSnapshot());

    // Restart
    setTimeout(() => {
      engine.start();
      setRunning(true);
    }, 100);
  }, []);

  const handleTrafficToggle = useCallback((mode) => {
    let next = mode;
    if (typeof next !== 'string') {
      next = trafficMode === 'NORMAL' ? 'RUSH_HOUR' : (trafficMode === 'RUSH_HOUR' ? 'LIVE_IGI' : 'NORMAL');
    }
    updateSimConfig(next, weatherMode, closedRunways);
  }, [trafficMode, weatherMode, closedRunways, updateSimConfig]);

  const handleWeatherToggle = useCallback(() => {
    const next = weatherMode === 'CLEAR' ? 'STORM' : 'CLEAR';
    updateSimConfig(trafficMode, next, closedRunways);
  }, [trafficMode, weatherMode, closedRunways, updateSimConfig]);

  const handleClosedRunwayToggle = useCallback((index) => {
    const next = closedRunways.includes(index)
      ? closedRunways.filter(i => i !== index)
      : [...closedRunways, index];
    updateSimConfig(trafficMode, weatherMode, next);
  }, [trafficMode, weatherMode, closedRunways, updateSimConfig]);

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
    updateSimConfig(trafficMode, weatherMode, closedRunways);
  }, [trafficMode, weatherMode, closedRunways, updateSimConfig]);

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
            trafficMode={trafficMode}
            weatherMode={weatherMode}
            closedRunways={closedRunways}
            speed={speed}
            running={running}
            onTrafficToggle={handleTrafficToggle}
            onWeatherToggle={handleWeatherToggle}
            onClosedRunwayToggle={handleClosedRunwayToggle}
            onSpeedChange={handleSpeedChange}
            onTogglePlay={handleTogglePlay}
            onReset={handleReset}
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
