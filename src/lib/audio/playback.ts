export interface AudioPlayer {
  play(url: string): Promise<void>;
  stop(): void;
  isPlaying(): boolean;
}

export function createPlayer(onEnd?: () => void): AudioPlayer {
  let audio: HTMLAudioElement | null = null;

  return {
    async play(url: string) {
      this.stop();
      audio = new Audio(url);
      await new Promise<void>((resolve, reject) => {
        if (!audio) return reject();
        audio.onended = () => {
          onEnd?.();
          resolve();
        };
        audio.onerror = () => reject(new Error("Playback failed"));
        audio.play().catch(reject);
      });
    },

    stop() {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio = null;
      }
    },

    isPlaying() {
      return audio !== null && !audio.paused;
    },
  };
}
