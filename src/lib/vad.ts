/**
 * Silero VAD (Voice Activity Detection) utility
 * Detects when the user starts/stops speaking for better ASR.
 *
 * Usage:
 *   import { createVAD } from '@/lib/vad';
 *   const vad = await createVAD();
 *   vad.onSpeechStart(() => console.log('Speech started'));
 *   vad.onSpeechEnd(() => console.log('Speech ended'));
 *   // Feed audio: vad.processAudio(audioBuffer);
 *   vad.destroy();
 */

export interface VADInstance {
  processAudio: (audio: Float32Array) => void;
  onSpeechStart: (callback: () => void) => void;
  onSpeechEnd: (callback: () => void) => void;
  destroy: () => void;
}

export async function createVAD(): Promise<VADInstance> {
  const VAD = await import('@ricky0123/vad-web');
  const { RealTimeVAD } = VAD as any;

  const speechStartCallbacks: (() => void)[] = [];
  const speechEndCallbacks: (() => void)[] = [];

  const options = {
    positiveSpeechThreshold: 0.5,
    negativeSpeechThreshold: 0.35,
    minSpeechFrames: 3,
    preSpeechPadFrames: 1,
    redoFramesOnSpeechEnd: true,
    onSpeechStart: () => {
      speechStartCallbacks.forEach((cb) => cb());
    },
    onSpeechEnd: () => {
      speechEndCallbacks.forEach((cb) => cb());
    },
  };

  let vad: any = null;

  if (RealTimeVAD) {
    vad = await RealTimeVAD.new(options);
  }

  return {
    processAudio: (audio: Float32Array) => {
      if (vad?.processAudio) {
        vad.processAudio(audio);
      }
    },
    onSpeechStart: (callback) => {
      speechStartCallbacks.push(callback);
    },
    onSpeechEnd: (callback) => {
      speechEndCallbacks.push(callback);
    },
    destroy: () => {
      if (vad?.destroy) {
        vad.destroy();
      }
    },
  };
}
