import type { GameEvent } from "../sim/types";
export class Sound {
  private context: AudioContext | null = null;
  private paused = false;
  private music = new Audio(`${import.meta.env.BASE_URL}audio/expedition.mp3`);
  private last: Record<string, number> = {};
  private shieldNoise: AudioBuffer | null = null;
  musicVolume = 0.5;
  effectsVolume = 0.5;
  muted = false;
  constructor() {
    this.music.loop = true;
    this.music.preload = "none";
  }
  unlock() {
    this.context ??= new AudioContext();
    void this.context.resume();
    this.apply();
    if (!this.muted && !this.paused) void this.music.play().catch(() => {});
  }
  apply() {
    // Midpoint maps to the owner's reference music level of 20%.
    this.music.volume = this.musicVolume * 0.4;
    this.music.muted = this.muted;
  }
  pause(paused: boolean) {
    this.paused = paused;
    if (paused) this.music.pause();
    else if (this.context && !this.muted)
      void this.music.play().catch(() => {});
  }
  setMuted(value: boolean) {
    this.muted = value;
    this.apply();
    if (value) this.music.pause();
    else this.unlock();
  }
  play(type: GameEvent["type"] | "ui") {
    const ctx = this.context;
    if (!ctx || this.muted || this.effectsVolume === 0) return;
    const now = ctx.currentTime;
    if (
      now - (this.last[type] ?? -10) <
      (type === "shot"
        ? 0.1
        : type === "hit" || type === "shield-hit"
          ? 0.08
          : 0.025)
    )
      return;
    this.last[type] = now;
    if (type === "shield-hit") {
      this.shieldThunk(now);
      return;
    }
    const tones: Record<string, [number, number, number]> = {
      ui: [440, 0.06, 0.08],
      build: [220, 0.16, 0.14],
      upgrade: [660, 0.24, 0.14],
      sell: [330, 0.1, 0.1],
      shot: [150, 0.035, 0.025],
      hit: [80, 0.045, 0.32],
      evade: [520, 0.045, 0.04],
      kill: [300, 0.06, 0.05],
      leak: [100, 0.26, 0.1],
      start: [294, 0.25, 0.12],
      payout: [784, 0.18, 0.13],
      win: [523, 0.25, 0.15],
      loss: [147, 0.5, 0.12],
    };
    const [hz, length, volume] = tones[type] ?? tones.ui;
    this.tone(
      hz,
      length,
      volume,
      now,
      type === "shot" || type === "hit" ? "triangle" : "sine",
    );
    if (type === "win" || type === "upgrade" || type === "payout") {
      this.tone(hz * 1.25, length, 0.1, now + 0.11);
      this.tone(hz * 1.5, length * 1.5, 0.1, now + 0.22);
    }
  }
  private shieldThunk(now: number) {
    const ctx = this.context!;
    this.shieldNoise ??= (() => {
      const buffer = ctx.createBuffer(
        1,
        Math.ceil(ctx.sampleRate * 0.09),
        ctx.sampleRate,
      );
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
        const grain = Math.sin(i * 72.31) * 43758.5453;
        samples[i] = (grain - Math.floor(grain)) * 2 - 1;
      }
      return buffer;
    })();
    const noise = ctx.createBufferSource();
    noise.buffer = this.shieldNoise;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 950;
    const impact = ctx.createGain();
    impact.gain.setValueAtTime(0.001, now);
    impact.gain.exponentialRampToValueAtTime(
      Math.max(0.001, 0.3 * this.effectsVolume * 2),
      now + 0.004,
    );
    impact.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    noise.connect(filter);
    filter.connect(impact);
    impact.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.09);
    this.tone(125, 0.11, 0.16, now, "triangle");
  }
  private tone(
    hz: number,
    length: number,
    volume: number,
    start: number,
    wave: OscillatorType = "sine",
  ) {
    const ctx = this.context!;
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(hz, start);
    o.frequency.exponentialRampToValueAtTime(hz * 0.85, start + length);
    g.gain.setValueAtTime(0.001, start);
    g.gain.exponentialRampToValueAtTime(
      Math.max(0.001, volume * this.effectsVolume * 2),
      start + 0.008,
    );
    g.gain.exponentialRampToValueAtTime(0.001, start + length);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(start);
    o.stop(start + length + 0.02);
  }
}
