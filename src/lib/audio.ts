import * as Tone from "tone";

export const createKotoSampler = () => {
  const reverb = new Tone.Reverb({
    decay: 2.0,
    wet: 0.6,
  }).toDestination();

  const eq = new Tone.EQ3({
    low: -6,    // Slightly reduces the bass
    mid: 0,     // Keeps the mid frequencies neutral
    high: 6,    // Boosts the treble for more brightness
  }).connect(reverb);

  const pitchShift = new Tone.PitchShift({
    pitch: 0,
    windowSize: 0.03,
  }).connect(eq);

  const sampler = new Tone.Sampler({
    urls: {
      C4: "/koto/koto_C4.wav",
    },
    release: 1.0,
    attack: 0.002, // Faster attack to emphasize initial harmonics
    volume: -6,
  }).connect(pitchShift);

  return { sampler, pitchShift };
};

export const getFrequency = (index: number) => {
  return 130.81 * Math.pow(2, index / 12);
};

export const getNoteFromIndex = (index: number) => {
  const noteNames = [
    "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
    "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
    "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5",
  ];
  return noteNames[index];
};

export const updatePitch = (
  pitchShift: Tone.PitchShift,
  offset: number,
  keyWidth: number,
  baseFreq: number
) => {
  const maxOffset = (2 * keyWidth) / 3;
  const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, offset));
  const maxFreqChange = baseFreq * (Math.pow(2, 1 / 12) - 1);

  let freqChange = (Math.abs(clampedOffset) / maxOffset) * maxFreqChange;
  if (Math.abs(clampedOffset) > 0) {
    freqChange += maxFreqChange * 0.1;
  }

  pitchShift.pitch = freqChange / maxFreqChange;
};
