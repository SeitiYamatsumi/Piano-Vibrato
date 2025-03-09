"use client";

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { createSynth, getFrequency } from "@/lib/audio";

type SynthInstance = ReturnType<typeof createSynth>;

const Piano = () => {
  const [synths, setSynths] = useState<Map<number, SynthInstance> | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  const keys = Array.from({ length: 32 }, (_, i) => i);

  // Initialize synths on mount
  useEffect(() => {
    const synthMap = new Map<number, SynthInstance>();
    keys.forEach((key) => synthMap.set(key, createSynth()));
    setSynths(synthMap);
    return () => {
      synthMap.forEach(({ synth, vibrato }) => {
        synth.dispose();
        vibrato.dispose();
      });
    };
  }, []);

  // Calculate speed and update vibrato
  const updateVibrato = (x: number, y: number, synth: SynthInstance) => {
    const now = performance.now();
    if (lastPositionRef.current) {
      const { x: lastX, y: lastY, time: lastTime } = lastPositionRef.current;
      const dx = x - lastX;
      const dy = y - lastY;
      const dt = (now - lastTime) / 1000; // Convert to seconds
      const speed = Math.sqrt(dx * dx + dy * dy) / dt; // Pixels per second
      const vibratoFreq = Math.min(speed / 50, 20); // Scale speed to 0-20 Hz
      synth.vibrato.frequency.value = vibratoFreq;
    }
    lastPositionRef.current = { x, y, time: now };
  };

  // Event handlers
  const handleStart = async (key: number, x: number, y: number) => {
    await Tone.start(); // Ensure audio context is started
    if (!synths) return;
    const { synth } = synths.get(key)!;
    synth.triggerAttack(getFrequency(key));
    updateVibrato(x, y, synths.get(key)!);
  };

  const handleMove = (key: number, x: number, y: number, isActive: boolean) => {
    if (!synths || !isActive) return;
    updateVibrato(x, y, synths.get(key)!);
  };

  const handleEnd = (key: number) => {
    if (!synths) return;
    const { synth } = synths.get(key)!;
    synth.triggerRelease();
    lastPositionRef.current = null; // Reset position tracking
  };

  return (
    <div className="p-4 bg-white rounded shadow-lg touch-none">
      <div className="grid grid-cols-8 gap-2">
        {keys.map((key) => (
          <div
            key={key}
            className="relative w-12 h-32 bg-gray-200 rounded flex flex-col items-center justify-end"
            onMouseDown={(e) => handleStart(key, e.clientX, e.clientY)}
            onMouseMove={(e) =>
              handleMove(key, e.clientX, e.clientY, e.buttons === 1)
            }
            onMouseUp={() => handleEnd(key)}
            onMouseLeave={() => handleEnd(key)}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              handleStart(key, touch.clientX, touch.clientY);
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              handleMove(key, touch.clientX, touch.clientY, true);
            }}
            onTouchEnd={() => handleEnd(key)}
          >
            <div className="w-1 h-28 bg-gray-400"></div>
            <span className="text-sm pb-2">{`Key ${key + 1}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Piano;
