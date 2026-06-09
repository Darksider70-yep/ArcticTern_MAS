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

    const dpr = window.devicePixelRatio || 1;
    const scale = getScale();
    scaleRef.current = scale;
    
    canvas.width = AIRPORT_WIDTH * scale * dpr;
    canvas.height = AIRPORT_HEIGHT * scale * dpr;
    canvas.style.width = `${AIRPORT_WIDTH * scale}px`;
    canvas.style.height = `${AIRPORT_HEIGHT * scale}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(scale * dpr, scale * dpr);

    drawStaticLayer(ctx);
    staticDrawn.current = true;
  }, [getScale]);

  // Draw dynamic layer every snapshot
  useEffect(() => {
    const canvas = dynamicCanvasRef.current;
    if (!canvas || !snapshot) return;

    const dpr = window.devicePixelRatio || 1;
    const scale = getScale();
    
    canvas.width = AIRPORT_WIDTH * scale * dpr;
    canvas.height = AIRPORT_HEIGHT * scale * dpr;
    canvas.style.width = `${AIRPORT_WIDTH * scale}px`;
    canvas.style.height = `${AIRPORT_HEIGHT * scale}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(scale * dpr, scale * dpr);
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
        const dpr = window.devicePixelRatio || 1;
        const scale = getScale();
        scaleRef.current = scale;
        
        canvas.width = AIRPORT_WIDTH * scale * dpr;
        canvas.height = AIRPORT_HEIGHT * scale * dpr;
        canvas.style.width = `${AIRPORT_WIDTH * scale}px`;
        canvas.style.height = `${AIRPORT_HEIGHT * scale}px`;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(scale * dpr, scale * dpr);
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
  ctx.fillStyle = '#060913';
  ctx.fillRect(0, 0, AIRPORT_WIDTH, AIRPORT_HEIGHT);

  // Technical HUD Coordinate Borders and Grid Ticks
  
  // 1. Crosshair Ticks Grid
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.15)';
  ctx.lineWidth = 0.5;
  for (let x = 100; x < AIRPORT_WIDTH; x += 100) {
    for (let y = 100; y < AIRPORT_HEIGHT; y += 100) {
      ctx.beginPath();
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x + 5, y);
      ctx.moveTo(x, y - 5);
      ctx.lineTo(x, y + 5);
      ctx.stroke();
    }
  }

  // Draw very faint dotted grid lines
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.04)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 8]);
  for (let x = 100; x < AIRPORT_WIDTH; x += 100) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, AIRPORT_HEIGHT);
    ctx.stroke();
  }
  for (let y = 100; y < AIRPORT_HEIGHT; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(AIRPORT_WIDTH, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Lat/Lon coordinate border ticks
  ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.font = '7px monospace';
  ctx.textAlign = 'center';

  // Top/Bottom Lon coordinates (approx DEL coordinates: 77° 04' E to 77° 08' E)
  for (let x = 100; x < AIRPORT_WIDTH; x += 200) {
    const lonMin = 4 + (x / AIRPORT_WIDTH) * 4;
    const lonSec = Math.round((lonMin % 1) * 60);
    const lonStr = `77°0${Math.floor(lonMin)}'${String(lonSec).padStart(2, '0')}"E`;
    
    // Top ticks
    ctx.fillText(lonStr, x, 12);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.beginPath();
    ctx.moveTo(x, 15);
    ctx.lineTo(x, 20);
    ctx.stroke();

    // Bottom ticks
    ctx.fillText(lonStr, x, AIRPORT_HEIGHT - 6);
    ctx.beginPath();
    ctx.moveTo(x, AIRPORT_HEIGHT - 20);
    ctx.lineTo(x, AIRPORT_HEIGHT - 15);
    ctx.stroke();
  }

  // Left/Right Lat coordinates (approx DEL coordinates: 28° 34' N to 28° 32' N)
  ctx.textAlign = 'left';
  for (let y = 100; y < AIRPORT_HEIGHT; y += 200) {
    const latMin = 34.5 - (y / AIRPORT_HEIGHT) * 2.5;
    const latSec = Math.round((latMin % 1) * 60);
    const latStr = `28°${Math.floor(latMin)}'${String(latSec).padStart(2, '0')}"N`;

    // Left ticks
    ctx.fillText(latStr, 4, y + 2);
    ctx.beginPath();
    ctx.moveTo(15, y);
    ctx.lineTo(20, y);
    ctx.stroke();

    // Right ticks
    ctx.fillText(latStr, AIRPORT_WIDTH - 52, y + 2);
    ctx.beginPath();
    ctx.moveTo(AIRPORT_WIDTH - 20, y);
    ctx.lineTo(AIRPORT_WIDTH - 15, y);
    ctx.stroke();
  }

  // 2. Corner HUD Panels
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = 'rgba(34, 211, 238, 0.5)';
  ctx.fillText('SECTOR: IGI_DELHI_APP', 25, 30);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.fillText('FREQ: 127.90 MHZ', 25, 40);
  ctx.fillText('RADAR: IND_PRIMARY_3D', 25, 50);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(34, 211, 238, 0.5)';
  ctx.fillText('AIRPORT: DEL / VIDP', AIRPORT_WIDTH - 25, 30);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.fillText('ELEV: 777 FT / 237 M', AIRPORT_WIDTH - 25, 40);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
  ctx.fillText('ATC MODE: MULTI-AGENT SYSTEM', AIRPORT_WIDTH - 25, 50);
  ctx.textAlign = 'left';

  // 3. Airspace VOR and FIX waypoints
  for (const wp of WAYPOINTS) {
    ctx.save();
    ctx.translate(wp.x, wp.y);

    if (wp.type === 'VOR') {
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
      ctx.fillStyle = 'rgba(34, 211, 238, 0.12)';
      ctx.lineWidth = 1.5;
      
      // Hexagon + inner details
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        ctx.lineTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
      ctx.beginPath();
      ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // FIX symbol
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, 3);
      ctx.lineTo(-5, 3);
      ctx.closePath();
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, -1);
      ctx.lineTo(0, 1);
      ctx.moveTo(-1, 0);
      ctx.lineTo(1, 0);
      ctx.stroke();
    }

    // Waypoint text
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(wp.id, 0, 15);
    ctx.restore();
  }

  // 4. Grass / Safety Areas
  ctx.fillStyle = 'rgba(12, 35, 12, 0.22)';
  const grassZones = [
    { x: 0, y: 0, w: AIRPORT_WIDTH, h: 130 },
    { x: 0, y: 170, w: AIRPORT_WIDTH, h: 120 },
    { x: 0, y: 340, w: AIRPORT_WIDTH, h: 150 },
    { x: 0, y: 535, w: AIRPORT_WIDTH, h: 105 },
    { x: 0, y: 695, w: AIRPORT_WIDTH, h: 105 }
  ];
  for (const gz of grassZones) {
    ctx.fillRect(gz.x, gz.y, gz.w, gz.h);
    
    // Contours inside the grass area
    ctx.strokeStyle = 'rgba(12, 55, 12, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(gz.x, gz.y + gz.h * 0.4);
    ctx.lineTo(gz.x + gz.w, gz.y + gz.h * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gz.x, gz.y + gz.h * 0.7);
    ctx.lineTo(gz.x + gz.w, gz.y + gz.h * 0.7);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ground service roads
  ctx.strokeStyle = 'rgba(75, 85, 99, 0.2)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  // Service road around T1
  ctx.moveTo(600, 170); ctx.lineTo(870, 170); ctx.lineTo(870, 250); ctx.lineTo(600, 250); ctx.closePath();
  // Service road around T2/T3
  ctx.moveTo(140, 410); ctx.lineTo(470, 410); ctx.lineTo(470, 520); ctx.lineTo(140, 520); ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // 5. Apron / Tarmac Concrete base
  ctx.fillStyle = '#171e2c'; 
  // T3 Apron
  ctx.fillRect(160, 420, 300, 95);
  // T2 Apron
  ctx.fillRect(280, 360, 150, 75);
  // T1 Apron
  ctx.fillRect(650, 160, 210, 105);

  // Gate Parking Guidelines
  ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
  ctx.lineWidth = 1;
  for (const gate of GATES) {
    ctx.beginPath();
    ctx.moveTo(gate.x, gate.y);
    ctx.lineTo(gate.x, gate.y - 12);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(gate.x - 3, gate.y - 6);
    ctx.lineTo(gate.x + 3, gate.y - 6);
    ctx.stroke();
  }

  // 6. Taxiways Structure
  ctx.strokeStyle = '#181f2b'; 
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
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

  // Taxiway borders/edges
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.35)';
  ctx.lineWidth = 9;
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

  // Cover edge borders with base asphalt
  ctx.strokeStyle = '#181f2b';
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

  // Taxiway Centerlines
  ctx.strokeStyle = '#eab308'; 
  ctx.lineWidth = 0.8;
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

  // Taxiway Holding Position Marks
  const holdNodes = ['R1E1', 'R1E2', 'R2E1', 'R2E2', 'R3E1', 'R3E2', 'R4E1', 'R4E2'];
  for (const hn of holdNodes) {
    const node = TAXIWAY_NODES.find(n => n.id === hn);
    if (node) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fill();
      
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(node.x - 5, node.y - 2);
      ctx.lineTo(node.x + 5, node.y + 2);
      ctx.stroke();
    }
  }

  // 7. Runways Detail
  for (const runway of RUNWAYS) {
    const dx = runway.x2 - runway.x1;
    const dy = runway.y2 - runway.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(runway.x1, runway.y1);
    ctx.rotate(angle);

    // Runway Asphalt body
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, -runway.width / 2, len, runway.width);

    // Runway borders
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, -runway.width / 2, len, runway.width);

    // Chevrons at start/end
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'; 
    ctx.lineWidth = 0.8;
    const drawBlastPad = (startX) => {
      for (let offset = 2; offset < 20; offset += 5) {
        ctx.beginPath();
        ctx.moveTo(startX + offset, -3);
        ctx.lineTo(startX + offset - 3, 0);
        ctx.lineTo(startX + offset, 3);
        ctx.stroke();
      }
    };
    drawBlastPad(0);
    drawBlastPad(len - 20);

    // Threshold markings (piano keys)
    ctx.fillStyle = '#ffffff';
    const numStripes = 8;
    const stripeWidth = 0.8;
    const stripeLen = 12;
    const spacing = runway.width / (numStripes + 1);

    for (let i = 1; i <= numStripes; i++) {
      const yOffset = -runway.width / 2 + i * spacing;
      ctx.fillRect(20, yOffset - stripeWidth / 2, stripeLen, stripeWidth);
      ctx.fillRect(len - 20 - stripeLen, yOffset - stripeWidth / 2, stripeLen, stripeWidth);
    }

    // Aiming point markings
    ctx.fillStyle = '#ffffff';
    const aimWidth = 2;
    const aimLen = 18;
    const aimOffset = runway.width * 0.22;
    // Aim Point 1
    ctx.fillRect(len * 0.2, -aimOffset - aimWidth / 2, aimLen, aimWidth);
    ctx.fillRect(len * 0.2, aimOffset - aimWidth / 2, aimLen, aimWidth);
    // Aim Point 2
    ctx.fillRect(len * 0.8 - aimLen, -aimOffset - aimWidth / 2, aimLen, aimWidth);
    ctx.fillRect(len * 0.8 - aimLen, aimOffset - aimWidth / 2, aimLen, aimWidth);

    // Touchdown zone markings
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const tdzPositions = [0.1, 0.15, 0.25, 0.3, 0.7, 0.75, 0.85, 0.9];
    for (const pos of tdzPositions) {
      const xOffset = len * pos;
      ctx.fillRect(xOffset, -aimOffset - 0.5, 8, 1);
      ctx.fillRect(xOffset, aimOffset - 0.5, 8, 1);
    }

    // Center line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(35, 0);
    ctx.lineTo(len - 35, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Runway names
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(runway.name.split('/')[0], 48, 1);
    ctx.fillText(runway.name.split('/')[1], len - 48, 1);

    // Green threshold lights
    ctx.fillStyle = '#22c55e'; 
    for (let i = -runway.width/2; i <= runway.width/2; i += 3) {
      ctx.beginPath();
      ctx.arc(20, i, 0.8, 0, Math.PI * 2);
      ctx.arc(len - 20, i, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Approach light lines
    ctx.fillStyle = '#f59e0b'; 
    for (let d = 5; d < 70; d += 12) {
      ctx.beginPath();
      ctx.arc(-d, 0, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-d, -2, 0.5, 4);

      ctx.beginPath();
      ctx.arc(len + d, 0, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(len + d, -2, 0.5, 4);
    }

    ctx.restore();
  }

  // 8. Terminal Buildings
  const r = 4;
  for (const term of TERMINALS) {
    ctx.save();
    
    const gradient = ctx.createLinearGradient(term.x, term.y, term.x, term.y + term.height);
    gradient.addColorStop(0, '#2e3a52');
    gradient.addColorStop(1, '#151c2c');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#4b638a'; 
    ctx.lineWidth = 1.5;

    roundRect(ctx, term.x, term.y, term.width, term.height, r);
    ctx.fill();
    ctx.stroke();

    // Skylight details
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(term.x + 10, term.y + term.height / 2);
    ctx.lineTo(term.x + term.width - 10, term.y + term.height / 2);
    ctx.stroke();

    // Terminal piers
    if (term.id === 'T3') {
      const piers = [235, 295, 355, 415];
      for (const px of piers) {
        const pierGrad = ctx.createLinearGradient(px, 480, px + 20, 505);
        pierGrad.addColorStop(0, '#2e3a52');
        pierGrad.addColorStop(1, '#151c2c');
        ctx.fillStyle = pierGrad;
        ctx.strokeStyle = '#4b638a';
        ctx.lineWidth = 1.5;

        roundRect(ctx, px, 480, 20, 25, 2);
        ctx.fill();
        ctx.stroke();

        // Jet bridges
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(px + 10, 505);
        ctx.lineTo(px + 10, 510);
        ctx.stroke();
      }
    }

    if (term.id === 'T1') {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.2;
      const t1GateXCoords = [710, 750, 790, 830];
      for (const gx of t1GateXCoords) {
        ctx.beginPath();
        ctx.moveTo(gx, 190);
        ctx.lineTo(gx, 180);
        ctx.stroke();
      }
    }

    if (term.id === 'T2') {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.2;
      const t2GateXCoords = [310, 350, 390];
      for (const gx of t2GateXCoords) {
        ctx.beginPath();
        ctx.moveTo(gx, 380);
        ctx.lineTo(gx, 370);
        ctx.stroke();
      }
    }

    // Terminal ID Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(term.id, term.x + term.width / 2, term.y + term.height / 2 + 3);

    ctx.restore();
  }

  // 9. Gates Markers & Labels
  for (const gate of GATES) {
    ctx.save();
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gate.x, gate.y);
    ctx.lineTo(gate.x, gate.y - 15);
    ctx.stroke();

    ctx.fillStyle = COLORS.gate;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(gate.id, gate.x, gate.y + 11);
    ctx.restore();
  }

  // 10. Holding pattern zones
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  for (const zone of HOLDING_ZONES) {
    ctx.beginPath();
    ctx.ellipse(zone.cx, zone.cy, zone.radius, zone.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(34, 211, 238, 0.03)';
    ctx.beginPath();
    ctx.ellipse(zone.cx, zone.cy, zone.radius, zone.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.setLineDash([]);

  // Holding zone labels
  ctx.fillStyle = 'rgba(34, 211, 238, 0.4)';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HOLD NORTH', HOLDING_ZONES[0].cx, HOLDING_ZONES[0].cy + 3);
  ctx.fillText('HOLD SOUTH', HOLDING_ZONES[1].cx, HOLDING_ZONES[1].cy + 3);

  // Compass rose
  drawCompass(ctx, 60, 75);
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
          ctx.arc(gatePos.x, gatePos.y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Turnaround progress
          if (gate.turnaroundTotal > 0) {
            const progress = 1 - (gate.turnaroundRemaining / gate.turnaroundTotal);
            ctx.strokeStyle = COLORS.success;
            ctx.lineWidth = 1.5;
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

  if (fuel < 15) color = COLORS.flightConflict;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((heading || 0) * Math.PI / 180);

  // Glow effect for airborne aircraft
  if (status === 'APPROACHING' || status === 'HOLDING' || status === 'DEPARTING') {
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
  }

  const s = size || 8;

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  // Nose / Fuselage capsule shape
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 1.1, s * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Swept Wings
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, -s * 0.25);
  ctx.lineTo(-s * 0.9, -s * 1.1); 
  ctx.lineTo(-s * 0.5, -s * 1.1);
  ctx.lineTo(s * 0.2, -s * 0.25);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-s * 0.3, s * 0.25);
  ctx.lineTo(-s * 0.9, s * 1.1); 
  ctx.lineTo(-s * 0.5, s * 1.1);
  ctx.lineTo(s * 0.2, s * 0.25);
  ctx.closePath();
  ctx.fill();

  // Tail horizontal stabilizers
  ctx.beginPath();
  ctx.moveTo(-s * 0.9, -s * 0.1);
  ctx.lineTo(-s * 1.2, -s * 0.45);
  ctx.lineTo(-s * 1.1, -s * 0.45);
  ctx.lineTo(-s * 0.7, -s * 0.1);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-s * 0.9, s * 0.1);
  ctx.lineTo(-s * 1.2, s * 0.45);
  ctx.lineTo(-s * 1.1, s * 0.45);
  ctx.lineTo(-s * 0.7, s * 0.1);
  ctx.closePath();
  ctx.fill();

  // Tail vertical fin line
  ctx.strokeStyle = '#05070c';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-s * 0.6, 0);
  ctx.lineTo(-s * 1.1, 0);
  ctx.stroke();

  // Jet Engine pods under wings
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.ellipse(-s * 0.2, -s * 0.5, s * 0.25, s * 0.12, 0, 0, Math.PI * 2);
  ctx.ellipse(-s * 0.2, s * 0.5, s * 0.25, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flashing Navigation & Strobe Lights
  if (status !== 'PARKED') {
    const time = Date.now();
    
    // Red Left Wingtip Nav Light
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-s * 0.85, -s * 1.1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Green Right Wingtip Nav Light
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(-s * 0.85, s * 1.1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Blinking White Strobes
    const strobeOn = (time % 800) < 80;
    if (strobeOn) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(-s * 0.85, -s * 1.15, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-s * 0.85, s * 1.15, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-s * 1.25, 0, 1.8, 0, Math.PI * 2); ctx.fill();
    }

    // Pulsing Red Beacon Light
    const beaconOn = (time % 600) < 150;
    if (beaconOn) {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(-s * 0.2, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.shadowBlur = 0;
  ctx.restore();

  // ATC Flight Data Block with leader line
  if (status !== 'PARKED' && status !== 'TAXIING_TO_GATE' && status !== 'TAXIING_TO_RUNWAY') {
    const tagX = x + (x < 500 ? -50 : 50);
    const tagY = y - 35;

    // Leader line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tagX + (x < 500 ? 35 : -35), tagY + 12);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Glassmorphism Data container
    ctx.fillStyle = 'rgba(10, 15, 28, 0.88)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 2;
    ctx.fillRect(tagX - 38, tagY - 10, 76, 28);
    ctx.strokeRect(tagX - 38, tagY - 10, 76, 28);
    ctx.restore();

    // Callsign
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 7.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(callsign, tagX - 33, tagY - 1);

    // Altitude & Fuel
    ctx.fillStyle = 'rgba(148, 163, 184, 0.95)';
    ctx.font = '6.5px monospace';
    ctx.fillText(`FL${String(Math.round(flight.altitude / 100)).padStart(3, '0')} F:${Math.round(fuel)}%`, tagX - 33, tagY + 6);

    // Status & Speed
    const statAbbr = status === 'APPROACHING' ? 'APPR' : status === 'HOLDING' ? 'HOLD' : status === 'LANDING' ? 'LNDG' : 'DEP';
    let altArrow = '■';
    if (status === 'APPROACHING' || status === 'LANDING') altArrow = '▼';
    if (status === 'DEPARTING') altArrow = '▲';
    
    ctx.fillText(`${statAbbr} S:${Math.round(flight.speed * 40)}KTS ${altArrow}`, tagX - 33, tagY + 13);
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

  const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;

  ctx.strokeStyle = severity === 'CRITICAL' ? COLORS.danger : COLORS.warning;
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

  // Outer light precipitation band (Green)
  ctx.fillStyle = 'rgba(34, 197, 94, 0.06)';
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Middle moderate precipitation band (Yellow)
  ctx.fillStyle = 'rgba(234, 179, 8, 0.1)';
  ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner severe core (Red storm core)
  ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ring details
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.12)';
  ctx.setLineDash([3, 10]);
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Lightning bolts
  if (Math.random() < 0.06) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.5;
    const lx = x + (Math.random() - 0.5) * (radius * 0.6);
    const ly = y + (Math.random() - 0.5) * (radius * 0.6);
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + 4, ly + 8);
    ctx.lineTo(lx - 2, ly + 10);
    ctx.lineTo(lx + 3, ly + 18);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(lx, ly + 12, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Storm label
  ctx.fillStyle = '#f97316';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ STORM CELL CORE', x, y - radius - 6);
}

function drawWeatherOverlay(ctx) {
  // Rain effect - falling lines at an angle
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
  ctx.lineWidth = 1.2;
  const time = Date.now() * 0.04;
  for (let i = 0; i < 40; i++) {
    const rx = (Math.random() * AIRPORT_WIDTH + time * 3) % AIRPORT_WIDTH;
    const ry = (Math.random() * AIRPORT_HEIGHT + time * 10) % AIRPORT_HEIGHT;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 3, ry + 10);
    ctx.stroke();
  }
}

function drawCompass(ctx, cx, cy) {
  const r = 24;

  // Outer ring
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.stroke();

  // Heading ticks
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 0.5;
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180;
    const x1 = cx + Math.cos(rad) * (r - 3);
    const y1 = cy + Math.sin(rad) * (r - 3);
    const x2 = cx + Math.cos(rad) * r;
    const y2 = cy + Math.sin(rad) * r;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Compass needles
  ctx.fillStyle = '#ef4444'; 
  ctx.beginPath();
  ctx.moveTo(cx, cy - r + 5);
  ctx.lineTo(cx - 4, cy - 2);
  ctx.lineTo(cx + 4, cy - 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#64748b'; 
  ctx.beginPath();
  ctx.moveTo(cx, cy + r - 5);
  ctx.lineTo(cx - 4, cy + 2);
  ctx.lineTo(cx + 4, cy + 2);
  ctx.closePath();
  ctx.fill();

  // Core pivot
  ctx.fillStyle = '#060913';
  ctx.beginPath();
  ctx.arc(cx, cy, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.stroke();

  // Labels
  ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
  ctx.font = 'bold 7.5px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, cy - r - 6);
  ctx.fillText('S', cx, cy + r + 6);
  ctx.fillText('E', cx + r + 7, cy);
  ctx.fillText('W', cx - r - 7, cy);
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
