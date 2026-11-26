// Tiny WebAudio bleeps — oscillator only, no audio files. One job: engine + cues.
let ctx = null;
let engineOsc = null;
let engineGain = null;
let muted = false;

export function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 55;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 320;
    engineGain = ctx.createGain();
    engineGain.gain.value = 0.0;
    engineOsc.connect(filter); filter.connect(engineGain); engineGain.connect(ctx.destination);
    engineOsc.start();
  } catch (e) { ctx = null; }
}

export function setEngine(speed, throttle, flying) {
  if (!ctx || !engineOsc) return;
  const target = muted || !flying ? 0 : 0.028 + throttle * 0.03;
  engineGain.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
  engineOsc.frequency.setTargetAtTime(52 + speed * 0.55, ctx.currentTime, 0.1);
}

export function toggleMute() { muted = !muted; return muted; }

export function blip(freq, dur, type, vol) {
  if (!ctx || muted) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch (e) { /* audio is garnish, never fatal */ }
}

export const cueRing = () => { blip(880, 0.12, 'sine', 0.14); setTimeout(() => blip(1320, 0.18, 'sine', 0.14), 90); };
export const cueMiss = () => blip(180, 0.25, 'square', 0.08);
export const cueDrop = () => { blip(520, 0.1, 'triangle', 0.14); setTimeout(() => blip(780, 0.2, 'triangle', 0.14), 110); };
export const cueCrash = () => blip(70, 0.6, 'sawtooth', 0.16);
export const cueWin = () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.13), i * 130)); };
