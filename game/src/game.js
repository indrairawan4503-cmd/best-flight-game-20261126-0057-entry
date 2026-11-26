// Game loop, input and deterministic screenshot scenes. One job: run the flight.
import { VIEW_W, VIEW_H, MISSIONS, SEG_LEN } from './config.js';
import { buildCanyon } from './canyon.js';
import { newPlane, updatePlane } from './plane.js';
import { drawScene } from './render.js';
import { drawHud, drawTitle, drawEnd, drawPaused } from './hud.js';
import {
  ensureAudio, setEngine, cueRing, cueMiss, cueDrop, cueCrash, cueWin, toggleMute,
} from './audio.js';

export class CanyonGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.seed = 1;
    this.missionIndex = 0;
    this.mission = MISSIONS[0];
    this.canyon = buildCanyon(this.seed, this.mission);
    this.plane = newPlane(this.mission);
    this.input = {
      up: false, down: false, left: false, right: false,
      climb: false, descend: false, mouseActive: false, mouseSteer: 0, dropQueued: false,
    };
    this.last = performance.now();
    this.t = 0;
    this.prevRings = 0;
    this.prevDrops = 0;
    this.prevState = 'title';
    this.shot = new URLSearchParams(window.location.search).get('shot') || '';
    this.applyShot();
    this.bindInput();
  }

  applyShot() {
    const seedParam = Number(new URLSearchParams(window.location.search).get('seed') || '1');
    this.seed = Number.isFinite(seedParam) ? seedParam : 1;
    this.canyon = buildCanyon(this.seed, this.mission);
    this.plane = newPlane(this.mission);
    if (this.shot === 'start') {
      this.plane.state = 'title';
      this.plane.z = 60 * SEG_LEN;
      this.plane.alt = 380; this.plane.speed = 170; this.plane.throttle = 0.65;
    } else if (this.shot === 'play') {
      this.plane.state = 'playing';
      // Park the plane just before ring 3 so a ring glows ahead in frame.
      const ring = this.canyon.rings[2];
      this.plane.z = ring.seg * SEG_LEN - 2600;
      // Offset sideways so the ring ahead reads clearly beside the plane.
      this.plane.x = Math.max(-0.9, Math.min(0.9, ring.x * 0.4 + 0.38));
      this.plane.alt = ring.alt;
      this.plane.speed = 205; this.plane.throttle = 0.78;
      // Rings already behind the plane count as flown past, silently.
      for (const r of this.canyon.rings) {
        if (r.seg * SEG_LEN < this.plane.z) r.passed = true;
      }
    } else if (this.shot === 'end') {
      this.plane.state = 'complete';
      this.plane.z = this.canyon.trackLength - SEG_LEN * 22;
      this.plane.alt = 110; this.plane.speed = 82; this.plane.throttle = 0.25;
      this.plane.ringsHit = this.mission.rings; this.plane.score = 7420;
      this.plane.landed = true; this.plane.elapsed = 96;
    }
  }

  startMission(index) {
    this.missionIndex = index;
    this.mission = MISSIONS[index];
    this.canyon = buildCanyon(this.seed, this.mission);
    this.plane = newPlane(this.mission);
    this.plane.state = 'playing';
    this.plane.speed = 90;
    this.prevRings = 0; this.prevDrops = 0;
    ensureAudio();
  }

  bindInput() {
    const keymap = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      KeyW: 'climb', KeyS: 'descend',
    };
    window.addEventListener('keydown', (e) => {
      if (keymap[e.key] || e.code in keymap) {
        this.input[keymap[e.key] || keymap[e.code]] = true;
        e.preventDefault();
      }
      if (e.code === 'Space') {
        this.input.dropQueued = true;
        ensureAudio();
        e.preventDefault();
      }
      if (e.code === 'KeyP' && this.plane.state === 'playing') this.plane.state = 'paused';
      else if (e.code === 'KeyP' && this.plane.state === 'paused') this.plane.state = 'playing';
      if (e.code === 'KeyM') toggleMute();
      if (e.code === 'KeyR' && this.plane.state !== 'title') this.startMission(this.missionIndex);
      if (e.code === 'Enter' && this.plane.state === 'title') this.startMission(0);
      if (this.plane.state === 'title' && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
        this.startMission(Number(e.code.slice(-1)) - 1);
      }
      if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)
        && ['complete', 'crashed', 'outoffuel', 'timeout'].includes(this.plane.state)) {
        this.startMission(Number(e.code.slice(-1)) - 1);
      }
    });
    window.addEventListener('keyup', (e) => {
      if (keymap[e.key] || e.code in keymap) this.input[keymap[e.key] || keymap[e.code]] = false;
    });
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.input.mouseSteer = nx;
      this.input.mouseActive = Math.abs(nx) > 0.12;
    });
    this.canvas.addEventListener('mouseleave', () => { this.input.mouseActive = false; });
    this.canvas.addEventListener('mousedown', () => ensureAudio());
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0.016);
    this.last = now;
    this.t += dt;

    // Screenshot scenes hold still; live play advances.
    const frozen = this.shot === 'start' || this.shot === 'end';
    if (!frozen) updatePlane(this.plane, this.input, this.canyon, this.mission, dt);
    if (this.plane.state === 'playing') {
      if (this.plane.ringsHit > this.prevRings) cueRing();
      else if (this.plane.ringsMissed > 0 && this.plane.message.startsWith('RING MISSED')) cueMiss();
      if (this.plane.drops > this.prevDrops) cueDrop();
      this.prevRings = this.plane.ringsHit;
      this.prevDrops = this.plane.drops;
    }
    if (this.plane.state === 'crashed' && this.prevState !== 'crashed') cueCrash();
    if (this.plane.state === 'complete' && this.prevState !== 'complete') cueWin();
    this.prevState = this.plane.state;
    setEngine(this.plane.speed, this.plane.throttle, this.plane.state === 'playing');

    drawScene(this.ctx, this.plane, this.canyon, this.t);
    drawHud(this.ctx, this.plane, this.canyon, this.mission);
    if (this.plane.state === 'title') drawTitle(this.ctx, this.plane, this.mission);
    else if (this.plane.state === 'paused') drawPaused(this.ctx);
    else if (['complete', 'crashed', 'outoffuel', 'timeout'].includes(this.plane.state)) {
      drawEnd(this.ctx, this.plane, this.mission);
    }
    requestAnimationFrame((n) => this.frame(n));
  }

  run() {
    requestAnimationFrame((n) => { this.last = n; this.frame(n); });
  }
}
