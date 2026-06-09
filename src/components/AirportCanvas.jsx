// ArcticTern ATC — Airport Canvas (Two-Layer Renderer)
// Static layer: runways, taxiways, terminal, gates
// Dynamic layer: aircraft, trails, weather, conflicts

import { useRef, useEffect, useCallback } from 'react';
import { RUNWAYS, GATES, TERMINALS, TAXIWAY_NODES, TAXIWAY_EDGES, HOLDING_ZONES, AIRPORT_WIDTH, AIRPORT_HEIGHT } from '../engine/Airport.js';
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
    <div ref={containerRef} className="airport-canvas-container" id="airport-canvas">
      <canvas ref={staticCanvasRef} className="airport-canvas airport-canvas-static" />
      <canvas ref={dynamicCanvasRef} className="airport-canvas airport-canvas-dynamic" />
    </div>
  );
}

// ───── Static Layer ─────

function drawStaticLayer(ctx) {
  // Background
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, AIRPORT_WIDTH, AIRPORT_HEIGHT);

  // Grid
  ctx.strokeStyle = COLORS.gridLine;
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

  // Grass areas (dark green tint)
  ctx.fillStyle = 'rgba(12, 35, 12, 0.35)';
  ctx.fillRect(0, 0, AIRPORT_WIDTH, 130);
  ctx.fillRect(0, 170, AIRPORT_WIDTH, 130);
  ctx.fillRect(0, 340, AIRPORT_WIDTH, 160);
  ctx.fillRect(0, 540, AIRPORT_WIDTH, 110);
  ctx.fillRect(0, 690, AIRPORT_WIDTH, 110);

  // Taxiways
  ctx.strokeStyle = COLORS.taxiway;
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

  // Taxiway edges (lighter)
  ctx.strokeStyle = COLORS.taxiwayEdge;
  ctx.lineWidth = 1;
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
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, -runway.width / 2, len, runway.width);

    // Runway border
    ctx.strokeStyle = COLORS.runway;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, -runway.width / 2, len, runway.width);

    // Center line (dashed)
    ctx.strokeStyle = COLORS.runwayMarkings;
    ctx.lineWidth = 1;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(len - 20, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Threshold markings
    for (let i = -4; i <= 4; i += 2) {
      if (i === 0) continue;
      ctx.fillStyle = COLORS.runwayMarkings;
      ctx.fillRect(10, i - 0.5, 20, 1);
      ctx.fillRect(len - 30, i - 0.5, 20, 1);
    }

    // Runway labels
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(runway.name.split('/')[0], 40, 4);
    ctx.fillText(runway.name.split('/')[1], len - 40, 4);

    ctx.restore();
  }

  // Terminal buildings
  ctx.fillStyle = COLORS.terminal;
  ctx.strokeStyle = COLORS.terminalOutline;
  ctx.lineWidth = 2;
  const r = 6;
  for (const term of TERMINALS) {
    roundRect(ctx, term.x, term.y, term.width, term.height, r);
    ctx.fill();
    ctx.stroke();

    // Draw realistic terminal piers/fingers
    if (term.id === 'T3') {
      ctx.fillStyle = COLORS.terminal;
      ctx.strokeStyle = COLORS.terminalOutline;
      ctx.lineWidth = 2;
      // Pier 1
      ctx.fillRect(340, 435, 15, 30);
      ctx.strokeRect(340, 435, 15, 30);
      // Pier 2
      ctx.fillRect(450, 435, 15, 30);
      ctx.strokeRect(450, 435, 15, 30);
      // Pier 3
      ctx.fillRect(560, 435, 15, 30);
      ctx.strokeRect(560, 435, 15, 30);
    } else if (term.id === 'T1') {
      ctx.beginPath();
      ctx.arc(700, 240, 15, Math.PI, Math.PI * 1.5);
      ctx.stroke();
    }

    // Terminal label
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(term.id, term.x + term.width / 2, term.y + term.height / 2 + 3);
  }

  // Gates
  for (const gate of GATES) {
    // Gate connector line
    ctx.strokeStyle = COLORS.taxiway;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gate.x, gate.y);
    ctx.lineTo(gate.x, gate.y - 20);
    ctx.stroke();

    // Gate marker
    ctx.fillStyle = COLORS.gate;
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Gate label
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '8px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(gate.id, gate.x, gate.y + 14);
  }

  // Holding pattern zones
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  for (const zone of HOLDING_ZONES) {
    ctx.beginPath();
    ctx.ellipse(zone.cx, zone.cy, zone.radius, zone.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(34, 211, 238, 0.06)';
    ctx.beginPath();
    ctx.ellipse(zone.cx, zone.cy, zone.radius, zone.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.setLineDash([]);

  // Holding zone labels
  ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
  ctx.font = '9px Inter, sans-serif';
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

  // Weather status indicator
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
          ctx.fillStyle = COLORS.gateActive;
          ctx.beginPath();
          ctx.arc(gatePos.x, gatePos.y, 5, 0, Math.PI * 2);
          ctx.fill();

          // Turnaround progress
          if (gate.turnaroundTotal > 0) {
            const progress = 1 - (gate.turnaroundRemaining / gate.turnaroundTotal);
            ctx.strokeStyle = COLORS.success;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(gatePos.x, gatePos.y, 8, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
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
          ctx.globalAlpha = 0.7;

          // Draw X's along the runway length
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
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('CLOSED', len / 2, -15);
          
          ctx.restore();
        }
      } else if (runway.occupied) {
        const rDef = RUNWAYS.find(r => r.name === runway.name);
        if (rDef) {
          ctx.save();
          const dx = rDef.x2 - rDef.x1;
          const dy = rDef.y2 - rDef.y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          ctx.translate(rDef.x1, rDef.y1);
          ctx.rotate(angle);

          ctx.fillStyle = 'rgba(34, 211, 238, 0.08)';
          ctx.fillRect(0, -rDef.width / 2 - 2, len, rDef.width + 4);
          ctx.restore();
        }
      }
    }
  }
}

// ───── Drawing Helpers ─────

function drawAircraft(ctx, flight) {
  const { x, y, heading, status, size, callsign, fuel } = flight;

  // Bounds check
  if (x < -50 || x > AIRPORT_WIDTH + 50 || y < -50 || y > AIRPORT_HEIGHT + 50) return;

  // Color based on status
  let color;
  switch (status) {
    case 'APPROACHING': color = COLORS.flightArriving; break;
    case 'HOLDING': color = COLORS.flightHolding; break;
    case 'LANDING': color = COLORS.flightArriving; break;
    case 'DEPARTING': color = COLORS.flightDeparting; break;
    case 'TAXIING_TO_GATE':
    case 'TAXIING_TO_RUNWAY': color = COLORS.flightTaxiing; break;
    case 'PARKED': color = COLORS.flightParked; break;
    case 'GO_AROUND': color = COLORS.flightConflict; break;
    default: color = COLORS.flightArriving;
  }

  // Check for conflict (fuel < 15)
  if (fuel < 15) color = COLORS.flightConflict;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((heading || 0) * Math.PI / 180);

  // Glow effect for airborne aircraft
  if (status === 'APPROACHING' || status === 'HOLDING' || status === 'DEPARTING') {
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
  }

  // Aircraft triangle
  const s = size || 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.6, -s * 0.5);
  ctx.lineTo(-s * 0.3, 0);
  ctx.lineTo(-s * 0.6, s * 0.5);
  ctx.closePath();
  ctx.fill();

  // Wings
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-s * 0.2, -s * 0.8);
  ctx.lineTo(s * 0.2, 0);
  ctx.lineTo(-s * 0.2, s * 0.8);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.restore();

  // Callsign label (for airborne aircraft)
  if (status !== 'PARKED' && status !== 'TAXIING_TO_GATE' && status !== 'TAXIING_TO_RUNWAY') {
    ctx.fillStyle = 'rgba(241, 245, 249, 0.8)';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(callsign, x + s + 4, y - 4);

    // Altitude for airborne
    if (flight.altitude > 0) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.fillText(`${Math.round(flight.altitude)}ft`, x + s + 4, y + 6);
    }
  }
}

function drawTrail(ctx, flight) {
  const trail = flight.trail;
  if (trail.length < 2) return;

  const isDepart = flight.status === 'DEPARTING';
  ctx.strokeStyle = isDepart ? COLORS.flightTrailDepart : COLORS.flightTrail;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(trail[0].x, trail[0].y);
  for (let i = 1; i < trail.length; i++) {
    ctx.globalAlpha = (i / trail.length) * 0.5;
    ctx.lineTo(trail[i].x, trail[i].y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawConflictHighlight(ctx, f1, f2, severity) {
  const cx = (f1.x + f2.x) / 2;
  const cy = (f1.y + f2.y) / 2;
  const radius = 20;

  // Pulsing circle
  const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;

  ctx.strokeStyle = severity === 'CRITICAL' ? COLORS.danger : COLORS.warning;
  ctx.lineWidth = 2;
  ctx.globalAlpha = pulse;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Line between conflicting aircraft
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

  // Storm gradient
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, 'rgba(249, 115, 22, 0.25)');
  gradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.12)');
  gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Storm border
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Lightning bolts (random)
  if (Math.random() < 0.05) {
    ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)';
    ctx.lineWidth = 1;
    const lx = x + (Math.random() - 0.5) * radius;
    const ly = y + (Math.random() - 0.5) * radius;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + 5, ly + 10);
    ctx.lineTo(lx - 3, ly + 12);
    ctx.lineTo(lx + 2, ly + 22);
    ctx.stroke();
  }

  // Storm label
  ctx.fillStyle = 'rgba(249, 115, 22, 0.6)';
  ctx.font = 'bold 10px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⛈ STORM', x, y - radius - 8);
}

function drawWeatherOverlay(ctx) {
  // Subtle rain effect
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
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

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // N pointer
  ctx.fillStyle = COLORS.danger;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r + 2);
  ctx.lineTo(cx - 3, cy - r + 8);
  ctx.lineTo(cx + 3, cy - r + 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
  ctx.font = 'bold 8px Inter, sans-serif';
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
