/**
 * ISLA PERDIDA: SAR RESCUE - PROCEDURAL WEB AUDIO SYNTHESIZER
 * Generates all survival game sound effects, ambiances, and musical cues dynamically.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.campfireSource = null;
    this.rainSource = null;
    this.heliSource = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // --- Footsteps ---
  playFootstep(surface = 'sand') {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (surface === 'sand') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    } else if (surface === 'water') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 + Math.random() * 80, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.12);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110 + Math.random() * 20, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.07);
      gain.gain.setValueAtTime(0.035, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // --- Harvesting & Tools ---
  playChopWood() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);

    // Wood splinter snap
    this.playNoiseCrack(0.05, 0.12);
  }

  playMineStone() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(750 + Math.random() * 150, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  playHitFlesh() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playSwingWeapon() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.14);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  // --- Vitals & Consumption ---
  playEat() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const offset = i * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(260 + i * 40, t + offset);
      osc.frequency.exponentialRampToValueAtTime(140, t + offset + 0.05);

      gain.gain.setValueAtTime(0.08, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.05);
    }
  }

  playDrink() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.16);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  playCraftSuccess() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25]; // A major
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.12, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.35);
    });
  }

  playPlayerHurt() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // --- Animal Sounds ---
  playBoarGrunt() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.1);
    osc.frequency.linearRampToValueAtTime(65, t + 0.25);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  playWolfHowl() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.6);
    osc.frequency.exponentialRampToValueAtTime(320, t + 1.2);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.2);
  }

  // --- SAR Rescue Helicopter Sound ---
  startHelicopterRotor() {
    if (this.isMuted || this.heliSource) return;
    this.resume();
    if (!this.ctx) return;

    // Buffer noise modulated by low frequency oscillator
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter to give deep rotor thud
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;

    // LFO for rotor beats
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sawtooth';
    lfo.frequency.value = 6; // 6 beats per sec

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.25;

    const heliGain = this.ctx.createGain();
    heliGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    heliGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 3);

    noise.connect(filter);
    filter.connect(heliGain);
    heliGain.connect(this.masterGain);

    noise.start();
    this.heliSource = { noise, heliGain };
  }

  stopHelicopterRotor() {
    if (this.heliSource && this.ctx) {
      this.heliSource.heliGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
      setTimeout(() => {
        try {
          this.heliSource.noise.stop();
        } catch (e) {}
        this.heliSource = null;
      }, 1500);
    }
  }

  // --- Victory Fanfare ---
  playRescueSuccessFanfare() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const melody = [
      { f: 523.25, t: 0, d: 0.2 },     // C5
      { f: 659.25, t: 0.22, d: 0.2 },  // E5
      { f: 783.99, t: 0.44, d: 0.2 },  // G5
      { f: 1046.50, t: 0.68, d: 0.6 }  // C6 High
    ];

    melody.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t + n.t);

      gain.gain.setValueAtTime(0.2, t + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.t + n.d);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + n.t);
      osc.stop(t + n.t + n.d);
    });
  }

  playGameOver() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 2.5);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 2.5);
  }

  playNoiseCrack(volume = 0.1, duration = 0.08) {
    if (this.isMuted || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    noise.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
  }

  // Pleasant Two-Tone Item Pickup Pop / Chime
  playItemPickup() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Fast ascending chirp: 440Hz -> 880Hz
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }
}

window.soundEngine = new SoundEngine();
