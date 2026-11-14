// Tiny synthesized sound effects (Web Audio). Browser-only; safe to import on the server.

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (muted || typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.15,
  slideTo?: number,
) {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export const sfx = {
  setMuted(value: boolean) {
    muted = value;
  },
  tap() {
    tone(660, 0, 0.08, "triangle", 0.12);
  },
  gain() {
    tone(523, 0, 0.12, "triangle", 0.14);
    tone(784, 0.08, 0.16, "triangle", 0.14);
  },
  blocked() {
    tone(220, 0, 0.18, "square", 0.08);
    tone(180, 0.15, 0.22, "square", 0.08);
  },
  storm() {
    for (let i = 0; i < 3; i++) tone(500, i * 0.45, 0.4, "sawtooth", 0.07, 900);
  },
  shelter() {
    [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.2, "triangle", 0.13));
  },
  launch() {
    tone(120, 0, 1.6, "sawtooth", 0.06, 900);
    tone(240, 0.1, 1.5, "triangle", 0.05, 1400);
  },
  win() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.25, "triangle", 0.14));
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.2, 0.3, "sine", 0.15));
  },
};
