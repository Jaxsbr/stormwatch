import { afterEach, describe, expect, it, vi } from "vitest";
import { Sound } from "../src/audio/sound";

afterEach(() => vi.unstubAllGlobals());

describe("impact cue levels", () => {
  it("gives ordinary and shield hits enough gain beside default music", () => {
    const peaks: number[] = [];
    let musicVolume = 0;
    vi.stubGlobal(
      "Audio",
      class {
        loop = false;
        preload = "";
        muted = false;
        set volume(value: number) {
          musicVolume = value;
        }
        play() {
          return Promise.resolve();
        }
        pause() {}
      },
    );
    vi.stubGlobal(
      "AudioContext",
      class {
        currentTime = 1;
        sampleRate = 44100;
        destination = {};
        resume() {
          return Promise.resolve();
        }
        createOscillator() {
          return {
            type: "sine",
            frequency: {
              setValueAtTime() {},
              exponentialRampToValueAtTime() {},
            },
            connect() {},
            start() {},
            stop() {},
          };
        }
        createGain() {
          return {
            gain: {
              setValueAtTime() {},
              exponentialRampToValueAtTime(value: number) {
                peaks.push(value);
              },
            },
            connect() {},
          };
        }
        createBuffer() {
          return { getChannelData: () => new Float32Array(4000) };
        }
        createBufferSource() {
          return { buffer: null, connect() {}, start() {}, stop() {} };
        }
        createBiquadFilter() {
          return { type: "lowpass", frequency: { value: 0 }, connect() {} };
        }
      },
    );

    const sound = new Sound();
    expect(sound.musicVolume).toBe(0.5);
    expect(sound.effectsVolume).toBe(0.5);
    sound.unlock();
    sound.play("hit");
    const hitPeak = Math.max(...peaks);
    peaks.length = 0;
    sound.play("shield-hit");

    const shieldPeak = Math.max(...peaks);

    expect(musicVolume).toBe(0.2);
    expect(hitPeak).toBeCloseTo(0.32);
    expect(shieldPeak).toBeCloseTo(0.3);
    expect(hitPeak).toBeGreaterThan(shieldPeak);
  });
});
