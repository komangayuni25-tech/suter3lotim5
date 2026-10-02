// Web Audio API Synthesizer for cheerful educational game sound effects & adventure background music

interface NoteEvent {
  freq: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
}

class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  // Background Music (BGM) state
  public isBgmPlaying: boolean = false;
  public bgmVolume: number = 0.4; // Pleasant default volume (0 to 1)
  public readonly defaultTrackName: string = 'Musik Petualangan Resmi SD Negeri 3 Loloan Timur';
  public readonly defaultAudioSrc: string = '/audio/adventure-theme.mp3';
  public audioVersion: number = Date.now();
  private bgmAudio: HTMLAudioElement | null = null;
  private gestureUnlockAttached: boolean = false;

  // Listeners for UI state updates
  private bgmListeners: Array<(isPlaying: boolean, volume: number) => void> = [];

  constructor() {
    // Automatically sync latest uploaded default music timestamp to bypass browser cache
    if (typeof window !== 'undefined') {
      fetch('/api/audio-info')
        .then((r) => r.json())
        .then((data) => {
          if (data?.mtimeMs) {
            this.audioVersion = data.mtimeMs;
            if (this.bgmAudio && !this.isBgmPlaying) {
              this.bgmAudio.src = `${this.defaultAudioSrc}?v=${this.audioVersion}`;
            }
          }
        })
        .catch(() => {});
    }
  }

  public subscribeBgm(callback: (isPlaying: boolean, volume: number) => void) {
    this.bgmListeners.push(callback);
    return () => {
      this.bgmListeners = this.bgmListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyBgmChange() {
    this.bgmListeners.forEach((cb) => cb(this.isBgmPlaying, this.bgmVolume));
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // --- SOUND EFFECTS (SFX) ---

  playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // ignore
    }
  }

  playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch {
      // ignore
    }
  }

  playWrong() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // ignore
    }
  }

  playPosComplete() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 880, 1046.5]; // C5, E5, G5, A5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.1;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch {
      // ignore
    }
  }

  playTreasureChest() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const fanfare = [
        { f: 523.25, d: 0.15 },
        { f: 523.25, d: 0.15 },
        { f: 523.25, d: 0.15 },
        { f: 659.25, d: 0.4 },
        { f: 783.99, d: 0.3 },
        { f: 1046.5, d: 0.8 },
      ];
      let t = ctx.currentTime;
      fanfare.forEach((item) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, t);

        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + item.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + item.d + 0.05);
        t += item.d * 0.9;
      });
    } catch {
      // ignore
    }
  }

  // --- ADVENTURE BACKGROUND MUSIC (BGM) ENGINE ---

  public startBgm() {
    this.isBgmPlaying = true;
    this.notifyBgmChange();

    try {
      if (!this.bgmAudio) {
        this.bgmAudio = new Audio(`${this.defaultAudioSrc}?v=${this.audioVersion}`);
        this.bgmAudio.loop = true;
        this.bgmAudio.preload = 'auto';
      }
      this.bgmAudio.volume = this.bgmVolume;
      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Browser prevented autoplay before user gesture. Attach listener for the first interaction.
          console.info('BGM waiting for user interaction gesture to start playback', err);
          this.attachGestureUnlock();
        });
      }
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  private attachGestureUnlock() {
    if (this.gestureUnlockAttached) return;
    this.gestureUnlockAttached = true;

    const unlockHandler = () => {
      this.gestureUnlockAttached = false;
      window.removeEventListener('click', unlockHandler);
      window.removeEventListener('touchstart', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);

      if (this.isBgmPlaying && this.bgmAudio) {
        this.bgmAudio.play().catch(() => {});
      }
    };

    window.addEventListener('click', unlockHandler, { once: true, passive: true });
    window.addEventListener('touchstart', unlockHandler, { once: true, passive: true });
    window.addEventListener('keydown', unlockHandler, { once: true, passive: true });
  }

  public stopBgm() {
    this.isBgmPlaying = false;

    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      } catch {
        // ignore
      }
    }

    this.notifyBgmChange();
  }

  public toggleBgm() {
    if (this.isBgmPlaying) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  public reloadBgm() {
    this.stopBgm();
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio.src = '';
        this.bgmAudio = null;
      } catch {
        // ignore
      }
    }
    this.audioVersion = Date.now();
    this.bgmAudio = new Audio(`${this.defaultAudioSrc}?v=${this.audioVersion}`);
    this.bgmAudio.loop = true;
    this.bgmAudio.preload = 'auto';
    this.startBgm();
  }

  public setBgmVolume(volume: number) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));

    if (this.bgmAudio) {
      try {
        this.bgmAudio.volume = this.bgmVolume;
      } catch {
        // ignore
      }
    }

    this.notifyBgmChange();
  }
}

export function triggerHaptic(type: 'tap' | 'success' | 'error' | 'medium' = 'tap') {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'tap') navigator.vibrate(20);
      else if (type === 'success') navigator.vibrate([30, 40, 60]);
      else if (type === 'error') navigator.vibrate([60, 50, 60]);
      else if (type === 'medium') navigator.vibrate(40);
    } catch {
      // ignore
    }
  }
}

export const sounds = new SoundController();
