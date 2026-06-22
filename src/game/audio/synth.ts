type Osc = OscillatorNode;

const MELODY = [
  392, 440, 494, 523, 494, 440, 392, 330,
  349, 392, 440, 494, 440, 392, 349, 294,
  330, 392, 523, 587, 523, 494, 440, 392
];

export class AuroraAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer = 0;
  private step = 0;
  muted = false;

  async ensure(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.16;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") await this.context.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.16, this.master.context.currentTime, 0.02);
  }

  update(deltaSeconds: number, running: boolean): void {
    if (!running || !this.context || !this.master || this.muted) return;
    this.timer -= deltaSeconds;
    if (this.timer > 0) return;
    this.timer = 0.18;
    const note = MELODY[this.step % MELODY.length];
    const bass = this.step % 3 === 0 ? note / 2 : note / 3;
    this.playTone(note, 0.11, "square", 0.028);
    this.playTone(bass, 0.13, "triangle", 0.018);
    this.step += 1;
  }

  jump(): void {
    this.playTone(740, 0.07, "square", 0.06);
    setTimeout(() => this.playTone(988, 0.06, "square", 0.045), 55);
  }

  collect(): void {
    this.playTone(880, 0.055, "triangle", 0.055);
    setTimeout(() => this.playTone(1320, 0.06, "triangle", 0.04), 60);
  }

  hit(): void {
    this.playTone(140, 0.18, "sawtooth", 0.07);
  }

  clear(): void {
    [523, 659, 784, 1046].forEach((freq, index) => {
      setTimeout(() => this.playTone(freq, 0.14, "square", 0.06), index * 85);
    });
  }

  private playTone(frequency: number, duration: number, type: Osc["type"], volume: number): void {
    if (!this.context || !this.master || this.muted) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.025);
  }
}
