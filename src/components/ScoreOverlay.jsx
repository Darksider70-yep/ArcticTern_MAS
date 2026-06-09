// ArcticTern ATC — Score Overlay
// Animated efficiency score with color gradient and particle effects

import { useRef, useEffect, useState } from 'react';
import { getScoreColor } from '../utils/colors.js';

export default function ScoreOverlay({ score }) {
  const [displayScore, setDisplayScore] = useState(0);
  const [prevScore, setPrevScore] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    if (score === prevScore) return;

    const start = displayScore;
    const end = score;
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      setDisplayScore(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPrevScore(score);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const color = getScoreColor(displayScore);

  return (
    <div className="score-overlay" id="score-overlay">
      <div className="score-label">EFFICIENCY</div>
      <div className="score-value" style={{ color }}>
        {displayScore}
      </div>
      <div className="score-bar-container">
        <div
          className="score-bar"
          style={{
            width: `${displayScore}%`,
            background: `linear-gradient(90deg, ${getScoreColor(0)}, ${getScoreColor(50)}, ${getScoreColor(80)}, ${color})`,
          }}
        />
      </div>
      <div className="score-formula">R = -(D + F + C)</div>
    </div>
  );
}
