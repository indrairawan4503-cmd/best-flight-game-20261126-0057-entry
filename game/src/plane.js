// Plane physics + mission state. One job: how the aircraft moves and what it costs.
import { clamp } from './rng.js';
import { MAX_SPEED, MAX_ALT, SEG_LEN } from './config.js';

export function newPlane(mission) {
  return {
    z: 0, x: 0, alt: 420, speed: 0, throttle: 0.55,
    bank: 0, pitch: 0, fuel: mission.fuel, damage: 0,
    ringsHit: 0, ringsMissed: 0, nearMiss: 0, drops: 0,
    score: 0, timeLeft: mission.timeLimit, elapsed: 0,
    state: 'title', // title | playing | paused | complete | crashed | outoffuel | timeout
    message: '', messageT: 0, flash: 0, shake: 0,
    landed: false, best: null,
  };
}

export function updatePlane(plane, input, canyon, mission, dt) {
  if (plane.state !== 'playing') return;

  plane.elapsed += dt;
  plane.timeLeft -= dt;
  if (plane.timeLeft <= 0) { plane.state = 'timeout'; return; }

  // Throttle: Up raises, Down lowers. Fuel burns faster at high throttle.
  if (input.up) plane.throttle = clamp(plane.throttle + dt * 0.55, 0, 1);
  if (input.down) plane.throttle = clamp(plane.throttle - dt * 0.7, 0, 1);
  const targetSpeed = plane.throttle * MAX_SPEED;
  plane.speed += (targetSpeed - plane.speed) * Math.min(1, dt * 0.9);
  plane.fuel -= dt * (1.1 + plane.throttle * 3.4);
  if (plane.fuel <= 0) { plane.fuel = 0; plane.state = 'outoffuel'; return; }

  // Steering: Left/Right bank and turn; W/S pitch; mouse X steers too.
  let steer = 0;
  if (input.left) steer -= 1;
  if (input.right) steer += 1;
  if (input.mouseActive) steer += input.mouseSteer * 1.4;
  steer = clamp(steer, -1.4, 1.4);
  plane.bank += (steer * 0.85 - plane.bank) * Math.min(1, dt * 6);
  const seg = canyon.segments[Math.floor(plane.z / SEG_LEN) % canyon.segments.length];
  // The canyon bends the plane: fight the curve or ride it.
  plane.x += dt * (plane.bank * 0.62 - seg.curve * 0.055 * (plane.speed / MAX_SPEED));
  plane.x = clamp(plane.x, -1.35, 1.35);

  let pitch = 0;
  if (input.climb) pitch += 1;
  if (input.descend) pitch -= 1;
  plane.pitch += (pitch * 0.7 - plane.pitch) * Math.min(1, dt * 5);
  plane.alt += plane.pitch * dt * 260 * (0.4 + plane.speed / MAX_SPEED);
  plane.alt = clamp(plane.alt, 0, MAX_ALT);

  plane.z += plane.speed * dt * 9.2; // world units per second at full chat
  if (plane.messageT > 0) plane.messageT -= dt;
  if (plane.flash > 0) plane.flash -= dt;
  if (plane.shake > 0) plane.shake -= dt * 2;

  // Ground strike.
  if (plane.alt <= 2 && plane.speed > 40) {
    plane.damage += dt * 55;
    plane.shake = 0.5;
    if (plane.damage >= 100) { plane.state = 'crashed'; plane.best = 'You clipped the canyon floor.'; return; }
    plane.alt = 2;
  }
  // Wall scrape: beyond the canyon edge.
  if (Math.abs(plane.x) > 0.98) {
    plane.damage += dt * 38;
    plane.shake = 0.4;
    plane.x = clamp(plane.x, -0.98, 0.98);
    if (plane.damage >= 100) { plane.state = 'crashed'; plane.best = 'You scraped the canyon wall.'; return; }
  } else if (Math.abs(plane.x) > 0.8 && plane.speed > 150) {
    // Near-miss bonus, once per wall pass (time trial flavour).
    if (!plane._nearArmed) {
      plane._nearArmed = true;
      if (mission.id === 'trial') {
        plane.nearMiss += 1; plane.score += 150;
        plane.message = 'NEAR MISS +150'; plane.messageT = 1.2;
      }
    }
  }
  if (Math.abs(plane.x) < 0.7) plane._nearArmed = false;

  // Rings.
  for (const ring of canyon.rings) {
    if (ring.passed) continue;
    const ringZ = ring.seg * SEG_LEN;
    if (plane.z >= ringZ - 30 && plane.z < ringZ + 400) {
      const dx = Math.abs(plane.x - ring.x);
      const dy = Math.abs(plane.alt - ring.alt);
      if (dx < 0.34 && dy < RING_RADIUS) {
        ring.passed = true; ring.hit = true;
        plane.ringsHit += 1; plane.score += 500;
        plane.message = 'RING! +500'; plane.messageT = 1.4; plane.flash = 0.35;
      }
    } else if (plane.z >= ringZ + 400) {
      ring.passed = true; ring.hit = false;
      plane.ringsMissed += 1;
      if (mission.id === 'rings') plane.timeLeft -= 8;
      plane.message = 'RING MISSED −8s'; plane.messageT = 1.4;
    }
  }

  // Rescue drops: SPACE over a lit pad, low and slow.
  if (input.dropQueued) {
    input.dropQueued = false;
    let delivered = false;
    for (const pad of canyon.pads) {
      if (pad.done) continue;
      const padZ = pad.seg * SEG_LEN;
      if (Math.abs(plane.z - padZ) < 900 && Math.abs(plane.x - pad.x) < 0.4 && plane.alt < 520) {
        pad.done = true; plane.drops += 1; plane.score += 800;
        plane.message = 'SUPPLIES DELIVERED +800'; plane.messageT = 1.6; plane.flash = 0.35;
        delivered = true;
      }
    }
    if (!delivered) { plane.message = 'DROP MISSED — line up over a lit pad'; plane.messageT = 1.2; }
  }

  // Finish: cross the end of the canyon.
  if (plane.z >= canyon.trackLength - SEG_LEN * 2) {
    plane.state = 'complete';
    plane.landed = plane.alt < 140 && plane.speed < 200;
    plane.score += plane.landed ? 1000 : 400;
    plane.score += Math.round(plane.fuel) * 10;
    plane.score += Math.max(0, Math.round(plane.timeLeft)) * 5;
  }
}

export function headingDegrees(plane, canyon) {
  const seg = canyon.segments[Math.floor(plane.z / SEG_LEN) % canyon.segments.length];
  const deg = (342 + seg.curve * 9 + plane.bank * 14) % 360;
  return (deg + 360) % 360;
}
