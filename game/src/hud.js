// HUD + screens. One job: the lit instrument bar and every menu overlay.
import { VIEW_W, VIEW_H, HUD_H, MISSIONS, PALETTE as P } from './config.js';
import { headingDegrees } from './plane.js';

function dial(ctx, cx, cy, r, label, value, max, unit, color) {
  ctx.save();
  ctx.translate(cx, cy);
  // Lit dial face.
  ctx.fillStyle = '#0b0b14';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;
  for (let i = 0; i <= 8; i++) {
    const a = (-Math.PI * 0.75) + (i / 8) * Math.PI * 1.5;
    const major = i % 4 === 0;
    ctx.strokeStyle = major ? color : '#5a5a6e';
    ctx.lineWidth = major ? 2.5 : 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 4), Math.sin(a) * (r - 4));
    ctx.lineTo(Math.cos(a) * (r - (major ? 12 : 8)), Math.sin(a) * (r - (major ? 12 : 8)));
    ctx.stroke();
  }
  const frac = Math.max(0, Math.min(1, value / max));
  const na = (-Math.PI * 0.75) + frac * Math.PI * 1.5;
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(na) * (r - 14), Math.sin(na) * (r - 14)); ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(label, 0, r + 17);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px monospace';
  ctx.fillText(String(Math.round(value)), 0, 6);
  ctx.fillStyle = '#8a8a9e';
  ctx.font = '10px sans-serif';
  ctx.fillText(unit, 0, 20);
  ctx.restore();
}

function compass(ctx, cx, cy, w, heading) {
  ctx.save();
  ctx.fillStyle = '#0b0b14';
  ctx.fillRect(cx - w / 2, cy - 16, w, 32);
  ctx.strokeStyle = P.litCyan; ctx.lineWidth = 1.5;
  ctx.shadowColor = P.litCyan; ctx.shadowBlur = 8;
  ctx.strokeRect(cx - w / 2, cy - 16, w, 32);
  ctx.shadowBlur = 0;
  ctx.fillStyle = P.litCyan;
  ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
  const marks = [[0, 'N'], [45, 'NE'], [90, 'E'], [135, 'SE'], [180, 'S'], [225, 'SW'], [270, 'W'], [315, 'NW']];
  for (const [deg, name] of marks) {
    let d = ((deg - heading + 540) % 360) - 180;
    if (Math.abs(d) > 70) continue;
    ctx.fillText(name, cx + (d / 70) * (w / 2 - 14), cy + 4);
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(cx, cy - 20); ctx.lineTo(cx - 5, cy - 28); ctx.lineTo(cx + 5, cy - 28); ctx.closePath(); ctx.fill();
  ctx.fillStyle = P.litCyan;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('HDG ' + String(Math.round(heading)).padStart(3, '0') + '°', cx, cy + 30);
  ctx.restore();
}

export function drawHud(ctx, plane, canyon, mission) {
  const top = VIEW_H - HUD_H;
  ctx.fillStyle = P.panel;
  ctx.fillRect(0, top, VIEW_W, HUD_H);
  ctx.fillStyle = P.panelEdge;
  ctx.fillRect(0, top, VIEW_W, 3);
  ctx.fillStyle = '#1e1e2c';
  ctx.fillRect(0, top + 3, VIEW_W, 2);

  dial(ctx, 70, top + 46, 36, 'ALT', plane.alt, 900, 'FT', P.litGreen);
  dial(ctx, 165, top + 46, 36, 'SPD', plane.speed, 265, 'KT', P.litAmber);
  compass(ctx, 300, top + 46, 150, headingDegrees(plane, canyon));

  // Fuel gauge.
  ctx.fillStyle = '#8a8a9e'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('FUEL', 400, top + 26);
  const fw = 150;
  ctx.fillStyle = '#22222e'; ctx.fillRect(400, top + 34, fw, 16);
  const fuelFrac = plane.fuel / 100;
  ctx.fillStyle = fuelFrac < 0.22 ? P.litRed : P.litGreen;
  ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
  ctx.fillRect(400, top + 34, fw * fuelFrac, 16);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px monospace';
  ctx.fillText(Math.round(plane.fuel) + '%', 400, top + 68);

  // Damage gauge.
  ctx.fillStyle = '#8a8a9e'; ctx.font = 'bold 12px sans-serif';
  ctx.fillText('HULL', 400, top + 88);
  ctx.fillStyle = '#22222e'; ctx.fillRect(452, top + 76, fw, 14);
  ctx.fillStyle = plane.damage > 60 ? P.litRed : P.litAmber;
  ctx.fillRect(452, top + 76, fw * (plane.damage / 100), 14);

  // Mission readouts.
  ctx.textAlign = 'left';
  ctx.fillStyle = P.litCyan; ctx.font = 'bold 15px sans-serif';
  ctx.fillText(mission.name, 590, top + 28);
  ctx.fillStyle = P.ink; ctx.font = '15px monospace';
  const ringsTotal = canyon.rings.length;
  ctx.fillText(`RINGS ${plane.ringsHit}/${ringsTotal}   DROPS ${plane.drops}/${mission.pads}   SCORE ${plane.score}`, 590, top + 52);
  const mm = Math.floor(Math.max(0, plane.timeLeft) / 60);
  const ss = Math.floor(Math.max(0, plane.timeLeft) % 60);
  ctx.fillStyle = plane.timeLeft < 30 ? P.litRed : P.ink;
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`TIME ${mm}:${String(ss).padStart(2, '0')}`, 590, top + 82);
  ctx.fillStyle = '#8a8a9e'; ctx.font = '12px sans-serif';
  ctx.fillText('THR ↑↓  TURN ←→  PITCH W/S  DROP SPACE  PAUSE P  MUTE M', 590, top + 102);

  // Throttle bar on the right.
  ctx.fillStyle = '#8a8a9e'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('THR', 1150, top + 26);
  ctx.fillStyle = '#22222e'; ctx.fillRect(1150, top + 34, 90, 16);
  ctx.fillStyle = P.litAmber;
  ctx.fillRect(1150, top + 34, 90 * plane.throttle, 16);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px monospace';
  ctx.fillText(Math.round(plane.throttle * 100) + '%', 1150, top + 68);

  // Transient centre message.
  if (plane.messageT > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, plane.messageT);
    ctx.fillStyle = '#0b0b14';
    ctx.fillRect(VIEW_W / 2 - 230, 92, 460, 44);
    ctx.strokeStyle = P.ring; ctx.lineWidth = 2; ctx.strokeRect(VIEW_W / 2 - 230, 92, 460, 44);
    ctx.fillStyle = P.ring; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(plane.message, VIEW_W / 2, 122);
    ctx.restore();
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(16, 8, 32, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H - HUD_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 64px sans-serif'; ctx.textAlign = 'center';
  ctx.shadowColor = accent; ctx.shadowBlur = 24;
  ctx.fillText(title, VIEW_W / 2, 190);
  ctx.shadowBlur = 0;
  ctx.fillStyle = P.ink;
  ctx.font = '20px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 250 + i * 34));
}

export function drawTitle(ctx, plane, mission) {
  overlay(ctx, 'CANYON RUN', [
    'A dusk flight down a winding canyon — chase view, prop plane, live instruments.',
    'Fly the rings, beat the clock, or drop supplies where they are needed.',
    '',
  ], P.sun);
  ctx.fillStyle = P.ink; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
  MISSIONS.forEach((m, i) => {
    const y = 356 + i * 62;
    ctx.fillStyle = i === 0 ? '#0b0b14' : 'rgba(11,11,20,0.55)';
    ctx.fillRect(VIEW_W / 2 - 330, y - 28, 660, 52);
    ctx.strokeStyle = P.ring; ctx.lineWidth = i === 0 ? 2.5 : 1;
    ctx.strokeRect(VIEW_W / 2 - 330, y - 28, 660, 52);
    ctx.fillStyle = i === 0 ? P.ring : P.ink;
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(`${m.key} — ${m.name} · ${m.tag}`, VIEW_W / 2, y - 2);
    ctx.fillStyle = '#c9c2d4'; ctx.font = '14px sans-serif';
    ctx.fillText(m.blurb, VIEW_W / 2, y + 18);
  });
  ctx.fillStyle = P.litCyan; ctx.font = '16px sans-serif';
  ctx.fillText('Press 1 / 2 / 3 to pick a mission — or ENTER for Ring Run', VIEW_W / 2, 552);
  ctx.fillStyle = '#c9c2d4'; ctx.font = '15px sans-serif';
  ctx.fillText('↑↓ throttle · ←→ bank & turn · W/S pitch · SPACE drop · P pause · M mute', VIEW_W / 2, 580);
}

export function drawEnd(ctx, plane, mission) {
  if (plane.state === 'complete') {
    const lines = [
      plane.landed ? 'Flared onto the runway — a proper landing.' : 'Crossed the finish line — flyover finish.',
      `Rings ${plane.ringsHit}/${mission.rings} · Drops ${plane.drops}/${mission.pads} · Fuel left ${Math.round(plane.fuel)}%`,
      `SCORE ${plane.score}   TIME ${Math.round(plane.elapsed)}s`,
      'Press R to fly again, or 1 / 2 / 3 for another mission.',
    ];
    overlay(ctx, 'MISSION COMPLETE', lines, P.litGreen);
  } else if (plane.state === 'crashed') {
    overlay(ctx, 'CRASHED', [
      plane.best || 'The canyon wins this round.',
      `Score ${plane.score} · Rings ${plane.ringsHit}/${mission.rings}`,
      'Press R to try again — mind the walls and the floor.',
    ], P.litRed);
  } else if (plane.state === 'outoffuel') {
    overlay(ctx, 'OUT OF FUEL', [
      'The tanks ran dry over the canyon.',
      `Score ${plane.score} · Rings ${plane.ringsHit}/${mission.rings}`,
      'Press R to refuel and try again — throttle burns fuel.',
    ], P.litRed);
  } else if (plane.state === 'timeout') {
    overlay(ctx, 'TIME UP', [
      'The clock beat you to the runway.',
      `Score ${plane.score} · Rings ${plane.ringsHit}/${mission.rings}`,
      'Press R to fly again — faster lines, fewer misses.',
    ], P.litAmber);
  }
}

export function drawPaused(ctx) {
  overlay(ctx, 'PAUSED', ['Press P to keep flying.', 'R restarts the mission.'], P.litCyan);
}
