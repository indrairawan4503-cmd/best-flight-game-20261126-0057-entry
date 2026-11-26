// Scene renderer — pseudo-3D canyon, rings, pads, runway and the chase-view plane.
// One job: draw everything the pilot sees, far to near.
import {
  VIEW_W, VIEW_H, HUD_H, SEG_LEN, DRAW_DIST, ROAD_W, CAM_DEPTH, PALETTE as P,
} from './config.js';
import { project } from './canyon.js';
import { clamp } from './rng.js';

function sky(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H - HUD_H);
  g.addColorStop(0, P.skyTop); g.addColorStop(0.45, P.skyMid); g.addColorStop(0.78, P.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H - HUD_H);
  // Low dusk sun with a glow.
  const sx = VIEW_W * 0.68, sy = (VIEW_H - HUD_H) * 0.42;
  const glow = ctx.createRadialGradient(sx, sy, 8, sx, sy, 190);
  glow.addColorStop(0, 'rgba(255, 243, 196, 0.95)');
  glow.addColorStop(0.25, 'rgba(255, 210, 122, 0.55)');
  glow.addColorStop(1, 'rgba(255, 210, 122, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - 200, sy - 200, 400, 400);
  ctx.fillStyle = P.sunCore;
  ctx.beginPath(); ctx.arc(sx, sy, 34, 0, Math.PI * 2); ctx.fill();
  // Drifting dusk clouds.
  ctx.fillStyle = 'rgba(255, 190, 150, 0.28)';
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 317 + t * 12) % (VIEW_W + 240)) - 120;
    const cy = 70 + i * 34;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 110, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 60, cy + 8, 80, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function mesas(ctx, plane, canyon, width) {
  // Far mesa silhouettes, parallaxed by the canyon bend.
  const seg = canyon.segments[Math.floor(plane.z / SEG_LEN) % canyon.segments.length];
  const drift = -seg.centerX * 0.02 - plane.x * 30;
  ctx.fillStyle = P.mesaFar;
  ctx.beginPath();
  ctx.moveTo(0, 430);
  for (let x = 0; x <= width; x += 40) {
    const h = 400 - 60 * Math.abs(Math.sin((x + drift) * 0.004)) - 30 * Math.sin((x + drift) * 0.013);
    ctx.lineTo(x, h);
  }
  ctx.lineTo(width, 430); ctx.closePath(); ctx.fill();
  ctx.fillStyle = P.mesaNear;
  ctx.beginPath();
  ctx.moveTo(0, 470);
  for (let x = 0; x <= width; x += 40) {
    const h = 450 - 46 * Math.abs(Math.sin((x - drift * 2) * 0.006 + 2));
    ctx.lineTo(x, h);
  }
  ctx.lineTo(width, 470); ctx.closePath(); ctx.fill();
}

function poly(ctx, x1, y1, x2, y2, x3, y3, x4, y4, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4);
  ctx.closePath(); ctx.fill();
}

function drawSegments(ctx, plane, canyon) {
  const baseIdx = Math.floor(plane.z / SEG_LEN);
  const baseSeg = canyon.segments[baseIdx % canyon.segments.length];
  const basePct = (plane.z % SEG_LEN) / SEG_LEN;
  const camX = plane.x * ROAD_W + baseSeg.centerX;
  const camY = baseSeg.y + plane.alt + 1050;
  const camZ = plane.z;
  let maxY = VIEW_H - HUD_H;

  // Project every visible segment first.
  const projected = [];
  for (let n = 0; n < DRAW_DIST; n++) {
    const seg = canyon.segments[(baseIdx + n) % canyon.segments.length];
    const looped = Math.floor((baseIdx + n) / canyon.segments.length) > 0;
    const segZ = baseIdx * SEG_LEN + n * SEG_LEN + (looped ? canyon.trackLength : 0);
    const p1 = project(
      { x: seg.centerX, y: seg.y, z: segZ }, camX, camY, camZ, VIEW_W, VIEW_H, CAM_DEPTH,
    );
    const p2 = project(
      { x: seg.centerX, y: seg.y, z: segZ + SEG_LEN }, camX, camY, camZ, VIEW_W, VIEW_H, CAM_DEPTH,
    );
    projected.push({ seg, p1, p2, n });
  }

  // Draw near to far, clipping each segment to the strip above maxY so the
  // nearer canyon floor always covers what is behind it.
  for (let n = 0; n < DRAW_DIST; n++) {
    const { seg, p1, p2 } = projected[n];
    if (p1.y >= maxY || p2.y >= p1.y) continue;
    const x1 = p1.x, x2 = p2.x;
    const w1 = p1.w, w2 = p2.w;
    const y1 = p1.y, y2 = p2.y;
    // Canyon floor: alternating rock bands, sand near the river.
    const floor = seg.index % 6 < 3 ? P.rockA : P.rockB;
    poly(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, floor);
    // River: teal strip down the middle of the floor.
    poly(ctx, x1 - w1 * 0.32, y1, x1 + w1 * 0.32, y1, x2 + w2 * 0.32, y2, x2 - w2 * 0.32, y2, P.river);
    ctx.fillStyle = P.riverHi;
    ctx.fillRect(x1 - w1 * 0.06, y2, Math.max(1, w1 * 0.12), Math.max(1, y1 - y2));
    // Runway: grey strip over the floor on the final stretch.
    if (seg.runway) {
      poly(ctx, x1 - w1 * 0.55, y1, x1 + w1 * 0.55, y1, x2 + w2 * 0.55, y2, x2 - w2 * 0.55, y2, P.runway);
      ctx.fillStyle = P.runwayLine;
      ctx.fillRect(x1 - 2, y2, 4, Math.max(1, y1 - y2));
    }
    // Canyon walls: tall rock faces left and right of the floor.
    const wallH1 = w1 * 1.15, wallH2 = w2 * 1.15;
    poly(ctx, x1 - w1 * 2.3, y1 - wallH1, x1 - w1, y1, x2 - w2, y2, x2 - w2 * 2.3, y2 - wallH2,
      seg.index % 6 < 3 ? P.wallA : P.wallB);
    poly(ctx, x1 + w1, y1, x1 + w1 * 2.3, y1 - wallH1, x2 + w2 * 2.3, y2 - wallH2, x2 + w2, y2,
      seg.index % 6 < 3 ? P.wallB : P.wallA);
    // Sunlit wall tops: a thin lit edge along the top of each wall.
    ctx.fillStyle = P.wallTop;
    ctx.beginPath();
    ctx.moveTo(x1 - w1 * 2.3, y1 - wallH1);
    ctx.lineTo(x1 - w1 * 2.02, y1 - wallH1);
    ctx.lineTo(x2 - w2 * 2.02, y2 - wallH2);
    ctx.lineTo(x2 - w2 * 2.3, y2 - wallH2);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x1 + w1 * 2.02, y1 - wallH1);
    ctx.lineTo(x1 + w1 * 2.3, y1 - wallH1);
    ctx.lineTo(x2 + w2 * 2.3, y2 - wallH2);
    ctx.lineTo(x2 + w2 * 2.02, y2 - wallH2);
    ctx.closePath(); ctx.fill();
    maxY = y1;
  }

  // Rings and pads, drawn after the floor so they sit on top of it.
  for (const ring of canyon.rings) {
    if (ring.passed && !ring.hit) continue;
    const rel = ring.seg * SEG_LEN - plane.z;
    if (rel < 0 || rel > DRAW_DIST * SEG_LEN) continue;
    const seg = canyon.segments[ring.seg];
    const s = project(
      { x: seg.centerX + ring.x * ROAD_W, y: seg.y + ring.alt, z: ring.seg * SEG_LEN },
      camX, camY, camZ, VIEW_W, VIEW_H, CAM_DEPTH,
    );
    // Ring radius in world units (~500) projected the same way as the road width.
    const r = Math.max(6, 500 * s.scale * (VIEW_W / 2));
    if (s.y < 20 || s.y > VIEW_H - HUD_H - 24) continue;
    ctx.lineWidth = Math.max(3, r * 0.14);
    ctx.strokeStyle = ring.hit ? P.ringHit : P.ring;
    ctx.shadowColor = P.ring; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = ring.hit ? P.ringHit : P.ring;
    ctx.font = `bold ${Math.max(12, r * 0.32)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('RING', s.x, s.y - r - 8);
  }
  for (const pad of canyon.pads) {
    const rel = pad.seg * SEG_LEN - plane.z;
    if (rel < 0 || rel > DRAW_DIST * SEG_LEN || pad.done) continue;
    const seg = canyon.segments[pad.seg];
    const s = project(
      { x: seg.centerX + pad.x * ROAD_W, y: seg.y + 30, z: pad.seg * SEG_LEN },
      camX, camY, camZ, VIEW_W, VIEW_H, CAM_DEPTH,
    );
    const r = Math.max(5, 520 * s.scale);
    ctx.fillStyle = pad.done ? '#555' : P.pad;
    ctx.shadowColor = P.pad; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.ellipse(s.x, s.y, r, r * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#06281c';
    ctx.font = `bold ${Math.max(11, r * 0.3)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('DROP', s.x, s.y + 4);
  }
}

// The chase-view prop plane, drawn as a built little aircraft, banked with the turn.
export function drawPlane(ctx, plane, t) {
  const cx = VIEW_W / 2 + plane.bank * 90 + plane.x * 26;
  const cy = (VIEW_H - HUD_H) * 0.66 + plane.pitch * -26 + Math.sin(t * 2.2) * 2;
  const bank = plane.bank * 0.5;
  const s = 1.0 + plane.speed / 1400;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(bank);
  ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8;
  // Fuselage: warm cream body with a teal stripe and orange nose.
  ctx.fillStyle = '#f2e3c2';
  ctx.beginPath();
  ctx.moveTo(0, -58); ctx.quadraticCurveTo(16, -30, 15, 18); ctx.quadraticCurveTo(12, 46, 0, 52);
  ctx.quadraticCurveTo(-12, 46, -15, 18); ctx.quadraticCurveTo(-16, -30, 0, -58);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#2fa8a0';
  ctx.fillRect(-15, -6, 30, 10);
  ctx.fillStyle = '#e2603c';
  ctx.beginPath(); ctx.moveTo(0, -58); ctx.quadraticCurveTo(11, -44, 10, -28); ctx.lineTo(-10, -28);
  ctx.quadraticCurveTo(-11, -44, 0, -58); ctx.closePath(); ctx.fill();
  // Cockpit canopy, lit from inside.
  ctx.fillStyle = '#bfe9ff';
  ctx.beginPath(); ctx.ellipse(0, -18, 9, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath(); ctx.ellipse(-3, -24, 3, 6, -0.4, 0, Math.PI * 2); ctx.fill();
  // Wings with roundels and a tailplane.
  ctx.fillStyle = '#d94f2b';
  ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(-118, 26); ctx.lineTo(-112, 44); ctx.lineTo(-12, 30); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(14, 6); ctx.lineTo(118, 26); ctx.lineTo(112, 44); ctx.lineTo(12, 30); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe14d';
  ctx.beginPath(); ctx.arc(-78, 30, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(78, 30, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c7431f';
  ctx.beginPath(); ctx.moveTo(-10, 40); ctx.lineTo(-46, 58); ctx.lineTo(-42, 66); ctx.lineTo(-8, 52); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(10, 40); ctx.lineTo(46, 58); ctx.lineTo(42, 66); ctx.lineTo(8, 52); ctx.closePath(); ctx.fill();
  // Spinning prop disc + hub at the nose.
  ctx.strokeStyle = 'rgba(240, 240, 255, 0.55)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.ellipse(0, -58, 26, 7, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(0, -58, 5, 0, Math.PI * 2); ctx.fill();
  // Navigation lights, blinking.
  if (Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(-118, 30, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7dff8a'; ctx.beginPath(); ctx.arc(118, 30, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawScene(ctx, plane, canyon, t) {
  const shakeX = plane.shake > 0 ? (Math.random() - 0.5) * plane.shake * 22 : 0;
  const shakeY = plane.shake > 0 ? (Math.random() - 0.5) * plane.shake * 14 : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  sky(ctx, t);
  mesas(ctx, plane, canyon, VIEW_W);
  drawSegments(ctx, plane, canyon);
  if (plane.state !== 'title') drawPlane(ctx, plane, t);
  if (plane.flash > 0) {
    ctx.fillStyle = `rgba(255, 225, 77, ${plane.flash * 0.5})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H - HUD_H);
  }
  ctx.restore();
}

export { clamp };
