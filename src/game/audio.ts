/* ============================================================
   MYSTERY OF THE LOST DIMENSIONS — Procedural Audio Engine
   Web Audio API: generative ambient music + synthesized SFX.
   ============================================================ */

export type AudioWorld = 'temple' | 'crystal' | 'lost';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private padOscillators: OscillatorNode[] = [];
  private currentWorld: AudioWorld = 'temple';
  private musicVolume = 0.65;
  private sfxVolume = 0.8;
  private started = false;

  /** Must be called from a user gesture at least once. */
  ensureStarted(world: AudioWorld = this.currentWorld) {
    if (this.started) { this.setWorld(world); return; }
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume * 0.5;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.master);
      this.started = true;
      this.buildPad(world);
      this.scheduleChimes();
    } catch {
      /* audio unavailable — game remains playable */
    }
  }

  setVolumes(music: number, sfx: number) {
    this.musicVolume = music;
    this.sfxVolume = sfx;
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(music * 0.5, this.ctx.currentTime, 0.15);
    if (this.sfxGain && this.ctx) this.sfxGain.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.05);
  }

  setWorld(world: AudioWorld) {
    if (world === this.currentWorld || !this.ctx) { this.currentWorld = world; return; }
    this.currentWorld = world;
    this.teardownPad();
    this.buildPad(world);
  }

  /* ---------------- ambient pad ---------------- */
  private padSpecs(world: AudioWorld): { freqs: number[]; detune: number; filter: number; type: OscillatorType } {
    switch (world) {
      case 'temple':  return { freqs: [55, 110, 164.81], detune: 7, filter: 520,  type: 'sine' };     // A1 A2 E3 — sacred drone
      case 'crystal': return { freqs: [65.41, 130.81, 196.0], detune: 10, filter: 760, type: 'triangle' }; // C pentatonic shimmer
      case 'lost':    return { freqs: [49, 98, 146.83], detune: 13, filter: 380, type: 'sawtooth' }; // G1 G2 D3 — hollow menace
    }
  }

  private buildPad(world: AudioWorld) {
    if (!this.ctx || !this.musicGain) return;
    const spec = this.padSpecs(world);
    this.padFilter = this.ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = spec.filter;
    this.padFilter.Q.value = 9;
    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.32;
    this.padFilter.connect(padGain);
    padGain.connect(this.musicGain);
    spec.freqs.forEach((f, i) => {
      const o = this.ctx!.createOscillator();
      o.type = spec.type;
      o.frequency.value = f;
      o.detune.value = (i - 1) * spec.detune;
      o.connect(this.padFilter!);
      o.start();
      this.padOscillators.push(o);
    });
    // slow filter sweep for breathing movement
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = world === 'lost' ? 0.05 : 0.085;
    lfoGain.gain.value = spec.filter * 0.45;
    lfo.connect(lfoGain);
    lfoGain.connect(this.padFilter.frequency);
    lfo.start();
    this.padOscillators.push(lfo);
  }

  private teardownPad() {
    this.padOscillators.forEach(o => { try { o.stop(); } catch { /* already stopped */ } try { o.disconnect(); } catch { /* noop */ } });
    this.padOscillators = [];
    if (this.padFilter) { try { this.padFilter.disconnect(); } catch { /* noop */ } this.padFilter = null; }
  }

  private scheduleChimes() {
    const pentatonics: Record<AudioWorld, number[]> = {
      temple:  [220, 246.94, 293.66, 329.63, 392, 440, 493.88],
      crystal: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33],
      lost:    [196, 220, 233.08, 293.66, 329.63, 392],
    };
    const tick = () => {
      if (!this.ctx || !this.musicGain) return;
      const scale = pentatonics[this.currentWorld];
      const note = scale[Math.floor(Math.random() * scale.length)];
      this.bell(note * (Math.random() < 0.3 ? 2 : 1), 6 + Math.random() * 6, 0.05 + Math.random() * 0.045, this.musicGain);
      window.setTimeout(tick, 5500 + Math.random() * 6500);
    };
    window.setTimeout(tick, 1800);
  }

  private bell(freq: number, duration: number, peak: number, dest: AudioNode) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o1.type = 'sine'; o1.frequency.value = freq;
    o2.type = 'sine'; o2.frequency.value = freq * 2.76; // inharmonic partial
    const g2 = this.ctx.createGain(); g2.gain.value = 0.22; o2.connect(g2); g2.connect(g);
    o1.connect(g);
    g.connect(dest);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o1.start(t); o2.start(t);
    o1.stop(t + duration + 0.05); o2.stop(t + duration + 0.05);
  }

  /* ---------------- primitive helpers ---------------- */
  private now() { return this.ctx ? this.ctx.currentTime : 0; }

  private tone(freq: number, type: OscillatorType, dur: number, vol: number, when = 0, slideTo?: number) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.now() + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
  }

  private noise(dur: number, vol: number, filterFreq: number, when = 0, type: BiquadFilterType = 'bandpass', q = 1) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.now() + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type; filter.frequency.value = filterFreq; filter.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter); filter.connect(g); g.connect(this.sfxGain);
    src.start(t);
  }

  /* ---------------- public SFX ---------------- */
  click()      { this.tone(1400, 'square', 0.05, 0.05); this.tone(2100, 'sine', 0.07, 0.06, 0.012); }
  hover()      { this.tone(1900, 'sine', 0.03, 0.025); }
  puzzleOpen() { this.tone(392, 'sine', 0.5, 0.14); this.tone(523.25, 'sine', 0.7, 0.12, 0.08); this.tone(784, 'sine', 0.9, 0.1, 0.16); }
  rotate()     { this.noise(0.08, 0.22, 900, 0, 'bandpass', 2); this.tone(660, 'triangle', 0.09, 0.1); }
  dialTick()   { this.tone(1750, 'square', 0.028, 0.05); this.noise(0.03, 0.12, 2400, 0, 'highpass'); }
  gearClang()  { this.tone(196, 'square', 0.35, 0.16, 0, 130); this.noise(0.22, 0.3, 500, 0, 'bandpass', 3); }
  step() {
    const p = 0.85 + Math.random() * 0.35;
    this.noise(0.1, 0.16, 480 * p, 0, 'lowpass');
    this.noise(0.06, 0.08, 1400 * p, 0.02, 'bandpass', 1.6);
  }
  shardPickup() {
    [880, 1174.66, 1567.98].forEach((f, i) => this.tone(f, 'sine', 0.5, 0.12, i * 0.07));
  }
  fail() {
    this.tone(130.81, 'sawtooth', 0.5, 0.18, 0, 82.41);
    this.tone(138.59, 'sawtooth', 0.5, 0.14, 0.02, 87.31);
    this.noise(0.4, 0.15, 220, 0.05, 'lowpass');
  }
  success() {
    const chord = [261.63, 329.63, 392.0, 523.25]; // C major — triumph
    chord.forEach((f, i) => { this.tone(f, 'triangle', 1.15, 0.16, i * 0.09); this.tone(f * 2, 'sine', 0.9, 0.07, i * 0.09 + 0.02); });
    this.bell(1046.5, 2.4, 0.1, this.sfxGain ?? this.master!);
  }
  doorOpen() {
    this.noise(1.6, 0.34, 140, 0, 'lowpass');
    this.tone(49, 'sine', 1.8, 0.3, 0, 36.71);
    this.tone(98, 'triangle', 1.2, 0.1, 0.55);
    [392, 523.25, 659.25].forEach((f) => this.bell(f, 2.2, 0.07, this.sfxGain ?? this.master!));
  }
  achievement() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 'square', 0.32, 0.07, i * 0.11));
    this.bell(1567.98, 1.8, 0.08, this.sfxGain ?? this.master!);
  }
  uiBack()     { this.tone(660, 'sine', 0.09, 0.08); this.tone(440, 'sine', 0.12, 0.08, 0.06); }
  sealedThud() { this.tone(73.42, 'sine', 0.4, 0.3, 0, 49); this.noise(0.28, 0.3, 180, 0.01, 'lowpass'); }
  hint()       { this.tone(987.77, 'sine', 0.4, 0.1); this.tone(1318.51, 'sine', 0.55, 0.09, 0.1); }
  countdownTick() { this.tone(1567.98, 'square', 0.04, 0.06); }
  victory() {
    const seq = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    seq.forEach((f, i) => { this.tone(f, 'triangle', 1.0, 0.15, i * 0.13); this.tone(f / 2, 'sine', 1.1, 0.1, i * 0.13); });
    this.bell(2093, 4, 0.09, this.sfxGain ?? this.master!);
  }
}

export const audio = new AudioEngine();
