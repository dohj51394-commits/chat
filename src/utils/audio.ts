// Web Audio API Sound Synthesizer for Android Chat effects

class SoundEffects {
  private ctx: AudioContext | null = null;
  private ringOscillator: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private isRinging = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play subtle sent tick sound
  playSent() {
    try {
      const ctx = this.initCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Audio playback might be restricted before user gesture
    }
  }

  // Play modern Android incoming message chime
  playReceived() {
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.1); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, now); // D6
      osc2.frequency.setValueAtTime(1760, now + 0.1); // A6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {
      // Ignored
    }
  }

  // Start realistic incoming phone ring loop
  startIncomingRing() {
    if (this.isRinging) return;
    this.isRinging = true;

    try {
      const ctx = this.initCtx();
      const playBurst = () => {
        if (!this.isRinging) return;
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, now); // Standard US/UK ring tone pair
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.setValueAtTime(0.18, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.4);
        osc2.stop(now + 1.4);

        if (this.isRinging) {
          setTimeout(playBurst, 3000);
        }
      };

      playBurst();
    } catch {
      // Audio playback restrictions
    }
  }

  // Start outgoing ring sound
  startOutgoingRing() {
    if (this.isRinging) return;
    this.isRinging = true;

    try {
      const ctx = this.initCtx();
      const playBurst = () => {
        if (!this.isRinging) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(425, now); // European/international dial tone

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.setValueAtTime(0.12, now + 1.0);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);

        if (this.isRinging) {
          setTimeout(playBurst, 2500);
        }
      };

      playBurst();
    } catch {
      // Audio
    }
  }

  // Stop any active ring
  stopRing() {
    this.isRinging = false;
    if (this.ringOscillator) {
      try {
        this.ringOscillator.stop();
        this.ringOscillator.disconnect();
      } catch {}
      this.ringOscillator = null;
    }
  }

  // Call ended disconnect tone
  playCallEnd() {
    this.stopRing();
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.setValueAtTime(480, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }
}

export const sounds = new SoundEffects();
