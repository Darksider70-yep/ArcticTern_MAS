// ArcticTern ATC — Airport Canvas (Two-Layer Renderer)
// Static layer: runways, taxiways, terminal, gates
// Dynamic layer: aircraft, trails, weather, conflicts

import { useRef, useEffect, useCallback } from 'react';
import { RUNWAYS, GATES, TERMINALS, WAYPOINTS, TAXIWAY_NODES, TAXIWAY_EDGES, HOLDING_ZONES, AIRPORT_WIDTH, AIRPORT_HEIGHT } from '../engine/Airport.js';
import { COLORS } from '../utils/colors.js';

export default function AirportCanvas({ snapshot }) {
  const staticCanvasRef = useRef(null);
  const dynamicCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const staticDrawn = useRef(false);
  const scaleRef = useRef(1);

  // Calculate scale to fit container
  const getScale = useCallback(() => {
    if (!containerRef.current) return 1;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / AIRPORT_WIDTH;
    const scaleY = rect.height / AIRPORT_HEIGHT;
    return Math.min(scaleX, scaleY);
  }, []);

  // Draw static layer (only once)
  useEffect(() => {
    const canvas = staticCanvasRef.current;
    if (!canvas || staticDrawn.current) return;

    const scale = getScale();
    scaleRef.current = scale;
    canvas.width = AIRPORT_WIDTH * scale;
    canvas.height = AIRPORT_HEIGHT * scale;

    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    drawStaticLayer(ctx);
    staticDrawn.current = true;
  }, [getScale]);

  // Draw dynamic layer every snapshot
  useEffect(() => {
    const canvas = dynamicCanvasRef.current;
    if (!canvas || !snapshot) return;

    const scale = getScale();
    canvas.width = AIRPORT_WIDTH * scale;
    canvas.height = AIRPORT_HEIGHT * scale;

    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, AIRPORT_WIDTH, AIRPORT_HEIGHT);

    drawDynamicLayer(ctx, snapshot);
    const animationFrame = requestAnimationFrame(() => drawDynamicLayer(ctx, snapshot));
    return () => cancelAnimationFrame(animationFrame);
  }, [snapshot, getScale]);

  // Redraw static on resize
  useEffect(() => {
    const handleResize = () => {
      staticDrawn.current = false;
      const canvas = staticCanvasRef.current;
      if (canvas) {
        const scale = getScale();
        scaleRef.current = scale;
        canvas.width = AIRPORT_WIDTH * scale;
        canvas.height = AIRPORT_HEIGHT * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        drawStaticLayer(ctx);
        staticDrawn.current = true;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getScale]);

  return (
    <div ref={containerRef} className="airport-canvas-container" id="airport-canvas" style={{ background: '#ffffff', border: '1px solid #ccc' }}>
      <canvas ref={staticCanvasRef} className="airport-canvas airport-canvas-static" />
      <canvas ref={dynamicCanvasRef} className="airport-canvas airport-canvas-dynamic" />
    </div>
  );
}

// ───── Static Layer ─────

function drawStaticLayer(ctx) {
  // Background - Professional Chart White
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, AIRPORT_WIDTH, AIRPORT_HEIGHT);

  // Faint Grid
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < AIRPORT_WIDTH; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, AIRPORT_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < AIRPORT_HEIGHT; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(AIRPORT_WIDTH, y);
    ctx.stroke();
  }

  // Airspace VOR and FIX waypoints
  for (const wp of WAYPOINTS) {
    ctx.save();
    ctx.translate(wp.x, wp.y);

    if (wp.type === 'VOR') {
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        ctx.lineTo(Math.cos(angle) * 7, Math.sin(angle) * 7);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, 3);
      ctx.lineTo(-5, 3);
      ctx.closePath();
      ctx.stroke();
    }

    // Waypoint text
    ctx.fillStyle = '#000000';
    ctx.font = '7px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(wp.id, 0, 14);
    ctx.restore();
  }

  // Taxiway edges
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 8;
  for (const edge of TAXIWAY_EDGES) {
    const n1 = TAXIWAY_NODES.find(n => n.id === edge[0]);
    const n2 = TAXIWAY_NODES.find(n => n.id === edge[1]);
    if (n1 && n2) {
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();
    }
  }

  // Taxiways fill
  ctx.strokeStyle = '#e5e5e5';
  ctx.lineWidth = 6;
  ctx.setLineDash([]);
  for (const edge of TAXIWAY_EDGES) {
    const n1 = TAXIWAY_NODES.find(n => n.id === edge[0]);
    const n2 = TAXIWAY_NODES.find(n => n.id === edge[1]);
    if (n1 && n2) {
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();
    }
  }

  // Taxiway Centerlines
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 0.5;
  for (const edge of TAXIWAY_EDGES) {
    const n1 = TAXIWAY_NODES.find(n => n.id === edge[0]);
    const n2 = TAXIWAY_NODES.find(n => n.id === edge[1]);
    if (n1 && n2) {
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();
    }
  }

  // Runways
  for (const runway of RUNWAYS) {
    const dx = runway.x2 - runway.x1;
    const dy = runway.y2 - runway.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(runway.x1, runway.y1);
    ctx.rotate(angle);

    // Runway surface
    ctx.fillStyle = '#b3b3b3';
    ctx.fillRect(0, -runway.width / 2, len, runway.width);

    // Runway border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, -runway.width / 2, len, runway.width);

    // Center line (dashed white)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(len - 20, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Threshold markings
    for (let i = -4; i <= 4; i += 2) {
      if (i === 0) continue;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, i - 0.5, 20, 1);
      ctx.fillRect(len - 30, i - 0.5, 20, 1);
    }

    // Runway labels
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.textAlign = 'center';
    
    ctx.save();
    ctx.translate(40, -10);
    ctx.fillText(runway.name.split('/')[0], 0, 0);
    ctx.restore();
    
    ctx.save();
    ctx.translate(len - 40, -10);
    ctx.fillText(runway.name.split('/')[1], 0, 0);
    ctx.restore();

    ctx.restore();
  }

  // Terminal buildings
  ctx.fillStyle = '#d4d4d4';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  const r = 2;
  for (const term of TERMINALS) {
    roundRect(ctx, term.x, term.y, term.width, term.height, r);
    ctx.fill();
    ctx.stroke();

    if (term.id === 'T3') {
      ctx.fillRect(340, 435, 15, 30);
      ctx.strokeRect(340, 435, 15, 30);
      ctx.fillRect(450, 435, 15, 30);
      ctx.strokeRect(450, 435, 15, 30);
      ctx.fillRect(560, 435, 15, 30);
      ctx.strokeRect(560, 435, 15, 30);
      
      // Clear overlapping lines
      ctx.fillStyle = '#d4d4d4';
      ctx.fillRect(341, 434, 13, 2);
      ctx.fillRect(451, 434, 13, 2);
      ctx.fillRect(561, 434, 13, 2);
    } else if (term.id === 'T1') {
      ctx.beginPath();
      ctx.arc(700, 240, 15, Math.PI, Math.PI * 1.5);
      ctx.stroke();
    }

    // Terminal label
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(term.id, term.x + term.width / 2, term.y + term.height / 2 + 3);
  }

  // Gates
  for (const gate of GATES) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gate.x, gate.y);
    ctx.lineTo(gate.x, gate.y - 20);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = '6px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(gate.id, gate.x, gate.y + 10);
  }

  // Holding pattern zones (Professional dashed line)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (const zone of HOLDING_ZONES) {
    ctx.beginPath();
    ctx.ellipse(zone.cx, zone.cy, zone.radius, zone.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 8px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOLD', HOLDING_ZONES[0].cx, HOLDING_ZONES[0].cy + 3);
  ctx.fillText('HOLD', HOLDING_ZONES[1].cx, HOLDING_ZONES[1].cy + 3);

  // Compass rose
  drawCompass(ctx, 60, 60);
}

// ───── Dynamic Layer ─────

function drawDynamicLayer(ctx, snapshot) {
  if (!snapshot) return;

  // Weather overlay
  if (snapshot.weather && snapshot.weather.stormCell) {
    drawStormCell(ctx, snapshot.weather.stormCell);
  }

  if (snapshot.weather && snapshot.weather.state === 'STORM') {
    drawWeatherOverlay(ctx, snapshot.weather);
  }

  // Flight trails
  for (const flight of snapshot.flights) {
    if (flight.trail && flight.trail.length > 1) {
      drawTrail(ctx, flight);
    }
  }

  // Conflict highlights
  if (snapshot.traffic && snapshot.traffic.conflicts) {
    for (const conflict of snapshot.traffic.conflicts) {
      const f1 = snapshot.flights.find(f => f.callsign === conflict.callsign1);
      const f2 = snapshot.flights.find(f => f.callsign === conflict.callsign2);
      if (f1 && f2) {
        drawConflictHighlight(ctx, f1, f2, conflict.severity);
      }
    }
  }

  // Aircraft
  for (const flight of snapshot.flights) {
    drawAircraft(ctx, flight);
  }

  // Gate occupancy indicators
  if (snapshot.gate) {
    for (const gate of snapshot.gate.gates) {
      if (gate.occupied) {
        const gatePos = GATES.find(g => g.id === gate.id);
        if (gatePos) {
          ctx.fillStyle = COLORS.success;
          ctx.beginPath();
          ctx.arc(gatePos.x, gatePos.y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Turnaround progress
          if (gate.turnaroundTotal > 0) {
            const progress = 1 - (gate.turnaroundRemaining / gate.turnaroundTotal);
            ctx.strokeStyle = COLORS.info;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(gatePos.x, gatePos.y, 7, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }
  }

  // Runway active indicators
  if (snapshot.runway) {
    for (const runway of snapshot.runway.runways) {
      if (!runway.active) {
        const rDef = RUNWAYS.find(r => r.name === runway.name);
        if (rDef) {
          ctx.save();
          const dx = rDef.x2 - rDef.x1;
          const dy = rDef.y2 - rDef.y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          
          ctx.translate(rDef.x1, rDef.y1);
          ctx.rotate(angle);

          ctx.strokeStyle = COLORS.danger;
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.8;

          for (let offset = 100; offset < len; offset += 200) {
            ctx.beginPath();
            ctx.moveTo(offset - 15, -10);
            ctx.lineTo(offset + 15, 10);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(offset - 15, 10);
            ctx.lineTo(offset + 15, -10);
            ctx.stroke();
          }

          ctx.fillStyle = COLORS.danger;
          ctx.font = 'bold 10px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('CLOSED', len / 2, -15);
          
          ctx.restore();
        }
      }
    }
  }
}

// ───── Drawing Helpers ─────

function drawAircraft(ctx, flight) {
  const { x, y, heading, status, size, callsign, fuel } = flight;

  if (x < -50 || x > AIRPORT_WIDTH + 50 || y < -50 || y > AIRPORT_HEIGHT + 50) return;

  let color = '#2563eb'; // Default blue for aircraft
  switch (status) {
    case 'APPROACHING': color = '#2563eb'; break;
    case 'HOLDING': color = '#d97706'; break;
    case 'LANDING': color = '#059669'; break;
    case 'DEPARTING': color = '#7c3aed'; break;
    case 'TAXIING_TO_GATE':
    case 'TAXIING_TO_RUNWAY': color = '#0ea5e9'; break;
    case 'PARKED': color = '#64748b'; break;
    case 'GO_AROUND': color = '#dc2626'; break;
  }

  if (fuel < 15) color = '#dc2626';

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((heading || 0) * Math.PI / 180);

  const s = size || 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.6, -s * 0.5);
  ctx.lineTo(-s * 0.3, 0);
  ctx.lineTo(-s * 0.6, s * 0.5);
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.restore();

  // ATC Flight Data Block
  if (status !== 'PARKED' && status !== 'TAXIING_TO_GATE' && status !== 'TAXIING_TO_RUNWAY') {
    const tagX = x + (x < 500 ? -45 : 45);
    const tagY = y - 30;

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tagX + (x < 500 ? 35 : -35), tagY + 10);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.fillRect(tagX - 35, tagY - 10, 70, 26);
    ctx.strokeRect(tagX - 35, tagY - 10, 70, 26);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 7px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(callsign, tagX - 31, tagY - 2);

    ctx.fillStyle = '#475569';
    ctx.font = '6px Arial';
    ctx.fillText(`FL${String(Math.round(flight.altitude / 100)).padStart(3, '0')} F:${Math.round(fuel)}%`, tagX - 31, tagY + 5);

    const statAbbr = status === 'APPROACHING' ? 'APPR' : status === 'HOLDING' ? 'HOLD' : status === 'LANDING' ? 'LNDG' : 'DEP';
    ctx.fillText(`${statAbbr} S:${Math.round(flight.speed * 40)}KTS`, tagX - 31, tagY + 12);
  }
}

function drawTrail(ctx, flight) {
  const trail = flight.trail;
  if (trail.length < 2) return;

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);

  ctx.beginPath();
  ctx.moveTo(trail[0].x, trail[0].y);
  for (let i = 1; i < trail.length; i++) {
    ctx.lineTo(trail[i].x, trail[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawConflictHighlight(ctx, f1, f2, severity) {
  const cx = (f1.x + f2.x) / 2;
  const cy = (f1.y + f2.y) / 2;
  const radius = 20;

  const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;

  ctx.strokeStyle = severity === 'CRITICAL' ? '#dc2626' : '#d97706';
  ctx.lineWidth = 2;
  ctx.globalAlpha = pulse;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(f1.x, f1.y);
  ctx.lineTo(f2.x, f2.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.globalAlpha = 1;
}

function drawStormCell(ctx, stormCell) {
  if (!stormCell) return;

  const { x, y, radius } = stormCell;

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
  gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.2)');
  gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('⛈ STORM', x, y - radius - 8);
}

function drawWeatherOverlay(ctx) {
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 30; i++) {
    const rx = Math.random() * AIRPORT_WIDTH;
    const ry = Math.random() * AIRPORT_HEIGHT;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 2, ry + 8);
    ctx.stroke();
  }
}

function drawCompass(ctx, cx, cy) {
  const r = 18;

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r + 2);
  ctx.lineTo(cx - 3, cy - r + 8);
  ctx.lineTo(cx + 3, cy - r + 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - r - 4);
  ctx.fillText('S', cx, cy + r + 10);
  ctx.fillText('E', cx + r + 8, cy + 3);
  ctx.fillText('W', cx - r - 8, cy + 3);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
