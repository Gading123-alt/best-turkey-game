// audio.js — every sound and the music, made with WebAudio code only.
// No audio files, no downloads: oscillators and a little noise, nothing else.
// The engine starts on the first key press or tap (browsers demand a gesture).

const MELODY = [
  // A cheerful autumn folk loop: note (Hz), beats. 0 = rest.
  [392, 1], [440, 1], [523, 1], [440, 1],
  [392, 1], [330, 1], [392, 2], [0, 1],
  [392, 1], [440, 1], [523, 1], [659, 1],
  [587, 1], [523, 1], [440, 2], [0, 1],
  [330, 1], [392, 1], [440, 1], [392, 1],
  [330, 1], [294, 1], [330, 2], [0, 1],
  [392, 1], [523, 1], [440, 1], [392, 1],
  [330, 1], [330, 1], [392, 2], [0, 1],
];

export class SoundEngine {
  constructor() {
    this.context = null;
    this.musicGain = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicOn = false;
  }

  // Call from a user gesture. Safe to call many times.
  unlock() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.musicGain) {
      this.musicGain.gain.value = muted ? 0 : 0.16;
    }
  }

  tone(freq, seconds, type, volume, when) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + (when || 0);
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(volume || 0.2, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  }

  // A short burst of noise for bumps and thuds.
  thud() {
    if (!this.context || this.muted) return;
    const length = Math.floor(this.context.sampleRate * 0.18);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (1 - i / length) * (Math.sin(i * 0.9) * 0.6);
    }
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    gain.gain.value = 0.3;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.context.destination);
    source.start();
  }

  gobble() {
    // The turkey's happy gobble: two quick descending clucks.
    this.tone(520, 0.09, 'square', 0.12, 0);
    this.tone(430, 0.09, 'square', 0.12, 0.1);
    this.tone(360, 0.12, 'square', 0.12, 0.2);
  }

  jump() {
    this.tone(300, 0.16, 'sine', 0.18, 0);
    this.tone(520, 0.14, 'sine', 0.14, 0.05);
  }

  dash() {
    this.tone(700, 0.1, 'triangle', 0.16, 0);
    this.tone(980, 0.12, 'triangle', 0.14, 0.06);
  }

  pickup() {
    this.tone(660, 0.08, 'triangle', 0.18, 0);
    this.tone(880, 0.1, 'triangle', 0.18, 0.07);
  }

  pumpkin() {
    this.tone(523, 0.09, 'triangle', 0.2, 0);
    this.tone(659, 0.09, 'triangle', 0.2, 0.08);
    this.tone(784, 0.14, 'triangle', 0.2, 0.16);
  }

  hit() {
    this.thud();
    this.tone(160, 0.25, 'sawtooth', 0.2, 0);
    this.tone(110, 0.3, 'sawtooth', 0.18, 0.08);
  }

  bark() {
    this.tone(220, 0.07, 'square', 0.14, 0);
    this.tone(180, 0.08, 'square', 0.14, 0.09);
  }

  stageClear() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => this.tone(freq, 0.16, 'triangle', 0.2, i * 0.11));
  }

  win() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((freq, i) => this.tone(freq, 0.2, 'triangle', 0.2, i * 0.13));
  }

  lose() {
    const notes = [392, 370, 349, 311];
    notes.forEach((freq, i) => this.tone(freq, 0.28, 'triangle', 0.18, i * 0.2));
  }

  startMusic() {
    if (this.musicOn || !this.context) return;
    this.musicOn = true;
    this.musicStep = 0;
    const beat = 0.24;
    const playStep = () => {
      if (!this.musicOn) return;
      const [freq, beats] = MELODY[this.musicStep % MELODY.length];
      if (freq > 0 && !this.muted) {
        const start = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + beat * beats);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(start);
        osc.stop(start + beat * beats);
      }
      this.musicStep += 1;
      this.musicTimer = window.setTimeout(playStep, beat * beats * 1000);
    };
    playStep();
  }

  stopMusic() {
    this.musicOn = false;
    if (this.musicTimer) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
