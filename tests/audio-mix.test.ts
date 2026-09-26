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
    sound.unlock();
    sound.play("hit");
    const hitPeak = Math.max(...peaks);
    peaks.length = 0;
    sound.play("shield-hit");

    expect(musicVolume).toBeLessThanOrEqual(0.18);
    expect(hitPeak).toBeGreaterThanOrEqual(0.12);
    expect(Math.max(...peaks)).toBeGreaterThanOrEqual(0.16);
  });
});
