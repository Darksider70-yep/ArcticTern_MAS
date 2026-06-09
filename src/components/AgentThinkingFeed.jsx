// ArcticTern ATC — Agent Thinking Feed
// Scrolling terminal-style log of agent decisions

import { useRef, useEffect } from 'react';
import { COLORS } from '../utils/colors.js';

const AGENT_COLORS = {
  weather: COLORS.agentWeather,
  runway: COLORS.agentRunway,
  gate: COLORS.agentGate,
  traffic: COLORS.agentTraffic,
  coordinator: COLORS.agentCoordinator,
  flight: COLORS.agentFlight,
};

export default function AgentThinkingFeed({ narrationLog }) {
  const feedRef = useRef(null);
  const isHovered = useRef(false);

  // Auto-scroll to top (newest first)
  useEffect(() => {
    if (feedRef.current && !isHovered.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [narrationLog]);

  if (!narrationLog || narrationLog.length === 0) return null;

  return (
    <div className="thinking-feed" id="agent-thinking-feed">
      <h3 className="panel-title">
        <span className="thinking-dot" />
        Agent Thinking Feed
      </h3>
      <div
        className="thinking-feed-scroll"
        ref={feedRef}
        onMouseEnter={() => { isHovered.current = true; }}
        onMouseLeave={() => { isHovered.current = false; }}
      >
        {narrationLog.slice(0, 40).map((entry, i) => (
          <div
            key={entry.id}
            className="thinking-entry"
            style={{
              opacity: Math.max(0.3, 1 - i * 0.03),
              borderLeftColor: AGENT_COLORS[entry.agentType] || COLORS.textMuted,
            }}
          >
            <span className="thinking-time">{entry.time}</span>
            <span className="thinking-text">{entry.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
