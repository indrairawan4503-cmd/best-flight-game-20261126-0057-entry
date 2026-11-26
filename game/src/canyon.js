// Canyon track builder. One job: turn a seed into segments, rings and drop pads.
import { SEG_LEN, SEGMENTS, ROAD_W } from './config.js';
import { mulberry32, hash01 } from './rng.js';

export function buildCanyon(seed, mission) {
  const rnd = mulberry32(seed);
  const segments = [];
  let centerX = 0;
  let elevation = 0;
  let curvePhase = rnd() * 6.28;

  for (let i = 0; i < SEGMENTS; i++) {
    // Gentle S-curves: a slow sine plus a sharper wiggle in the middle third.
    const slow = Math.sin(i * 0.011 + curvePhase) * 2.2;
    const wiggle = (i > 180 && i < 460) ? Math.sin(i * 0.043 + 1.7) * 1.6 : 0;
    const curve = slow + wiggle;
    centerX += curve * 34;
    // Rolling canyon floor, flat for the last 24 segments (the runway).
    const flat = i >= SEGMENTS - 24;
    elevation = flat ? 0 : Math.sin(i * 0.017 + 0.9) * 260 + Math.sin(i * 0.05) * 90;
    segments.push({
      index: i,
      curve,
      centerX,
      y: elevation,
      runway: flat,
      // Seeded decoration: rock spires on either wall, stable per segment.
      spireL: hash01(i, 11) > 0.86 ? hash01(i, 12) : 0,
      spireR: hash01(i, 21) > 0.86 ? hash01(i, 22) : 0,
      cactus: hash01(i, 31) > 0.93,
    });
  }

  // Rings: spread along the canyon, alternating sides and heights.
  const rings = [];
  const ringCount = mission.rings;
  for (let r = 0; r < ringCount; r++) {
    const seg = Math.floor(40 + ((SEGMENTS - 110 - 40) * (r + 0.5)) / ringCount);
    rings.push({
      seg,
      x: (r % 2 === 0 ? -0.42 : 0.42) * (0.55 + hash01(r, 41) * 0.45),
      alt: 300 + hash01(r, 42) * 380,
      passed: false, hit: false,
    });
  }

  // Rescue pads: flat lit circles on the canyon floor, late in the run.
  const pads = [];
  for (let p = 0; p < mission.pads; p++) {
    const seg = Math.floor(180 + p * 130 + hash01(p, 51) * 40);
    pads.push({ seg, x: (p % 2 === 0 ? -0.3 : 0.3), done: false });
  }

  return { segments, rings, pads, trackLength: SEGMENTS * SEG_LEN };
}

export function segmentAt(canyon, z) {
  const n = canyon.segments.length;
  const idx = Math.floor(z / SEG_LEN) % n;
  return canyon.segments[idx];
}

// Classic pseudo-3D projection: world point -> screen point.
export function project(p, camX, camY, camZ, width, height, camDepth) {
  const cz = p.z - camZ;
  const scale = camDepth / Math.max(cz, 1);
  return {
    x: Math.round(width / 2 + (scale * (p.x - camX) * width) / 2),
    y: Math.round(height / 2 - (scale * (p.y - camY) * height) / 2),
    w: Math.round((scale * ROAD_W * width) / 2),
    scale,
  };
}
