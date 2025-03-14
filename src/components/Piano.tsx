"use client";

import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import {
  createKotoSampler,
  getNoteFromIndex,
  updatePitch,
  getFrequency,
} from "@/lib/audio";

// Interface for each key's state
interface KeyState {
  sampler: Tone.Sampler;
  pitchShift: Tone.PitchShift;
  isPlaying: boolean;
  initialX: number;
  note: string;
  smoothedOffset: number;
  baseFreq: number;
  touchId?: number;
}

// Array of note names in order, representing keys on the piano
const noteNames = [
  "C3",
  "C#3",
  "D3",
  "D#3",
  "E3",
  "F3",
  "F#3",
  "G3",
  "G#3",
  "A3",
  "A#3",
  "B3",
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B4",
  "C5",
  "C#5",
  "D5",
  "D#5",
  "E5",
  "F5",
  "F#5",
  "G5",
];

const Piano = () => {
  const keyRefs = useRef<HTMLDivElement[]>([]); // Reference to store key DOM elements
  const scrollRef = useRef<HTMLDivElement>(null);
  const [keyStates, setKeyStates] = useState<Map<number, KeyState>>(new Map()); // State for each key's state
  const [audioStarted, setAudioStarted] = useState(false); // Flag to check if audio is started
  const [kotoSampler, setKotoSampler] = useState<ReturnType<
    typeof createKotoSampler
  > | null>(null); // Sampler for Koto sound

  // Initialize the Koto sampler
  useEffect(() => {
    const initializeSampler = async () => {
      const samplerInstance = createKotoSampler(); // Create the Koto sampler
      await samplerInstance.sampler.loaded; // Wait until the sampler is fully loaded
      setKotoSampler(samplerInstance); // Set the sampler in state
    };
    initializeSampler();
  }, []);

  // Start audio when the user clicks or touches the screen
  useEffect(() => {
    const startAudio = async () => {
      if (!audioStarted) {
        await Tone.start(); // Start the Tone.js audio context
        setAudioStarted(true); // Set the audioStarted flag to true
      }
    };
    document.addEventListener("click", startAudio);
    document.addEventListener("touchstart", startAudio);
    return () => {
      document.removeEventListener("click", startAudio);
      document.removeEventListener("touchstart", startAudio);
    };
  }, [audioStarted]);

  // Handle key press start (trigger sound on key down)
  const handleStart = (index: number, x: number, touchId?: number) => {
    if (!audioStarted || !kotoSampler || keyStates.get(index)?.isPlaying)
      return;

    const { sampler, pitchShift } = kotoSampler;
    const note = getNoteFromIndex(index); // Get the note name from the index
    const baseFreq = getFrequency(index); // Get the base frequency for pitch shifting

    sampler.triggerAttack(note); // Start playing the note

    setKeyStates((prev) => {
      const newStates = new Map(prev);
      newStates.set(index, {
        sampler,
        pitchShift,
        isPlaying: true,
        initialX: x, // Store the initial touch or mouse position
        note,
        smoothedOffset: 0,
        baseFreq,
        touchId,
      });
      return newStates;
    });
  };

  // Handle key movement (for pitch shifting)
  const handleMove = (index: number, x: number, touchId?: number) => {
    if (!audioStarted || !kotoSampler) return;

    const state = keyStates.get(index);
    if (
      !state ||
      !state.isPlaying ||
      (touchId !== undefined && state.touchId !== touchId)
    )
      return;

    const offset = x - state.initialX; // Calculate the offset of movement
    const keyWidth = isSharp(noteNames[index]) ? 48 : 80; // Determine key width based on sharp or regular note
    const smoothingFactor = 0.8; // Smooth transition factor for pitch adjustment

    const newSmoothedOffset =
      state.smoothedOffset + smoothingFactor * (offset - state.smoothedOffset); // Apply smoothing

    setKeyStates((prev) => {
      const newStates = new Map(prev);
      newStates.set(index, { ...state, smoothedOffset: newSmoothedOffset });
      return newStates;
    });

    updatePitch(state.pitchShift, newSmoothedOffset, keyWidth, state.baseFreq); // Update the pitch based on the new offset
  };

  // Handle key release (stop sound on key up)
  const handleEnd = (index: number, touchId?: number) => {
    if (!audioStarted || !kotoSampler) return;

    const state = keyStates.get(index);
    if (
      !state ||
      !state.isPlaying ||
      (touchId !== undefined && state.touchId !== touchId)
    )
      return;

    state.pitchShift.pitch = 0; // Reset pitch shift
    setKeyStates((prev) => {
      const newStates = new Map(prev);
      newStates.delete(index); // Remove the key state from map
      return newStates;
    });
    setTimeout(() => {
      state.sampler.triggerRelease(state.note); // Stop playing the note after a short delay
    }, 100);
  };

  // Event handlers for mouse interactions
  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(index, e.clientX); // Start the note on mouse down
  };

  const handleMouseMove = (index: number, e: React.MouseEvent) => {
    if (keyStates.get(index)?.isPlaying) {
      e.preventDefault();
      handleMove(index, e.clientX); // Move the note on mouse move
    }
  };

  const handleMouseUp = (index: number) => {
    handleEnd(index); // End the note on mouse up
  };

  // Event handlers for touch interactions
  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(index, touch.clientX, touch.identifier); // Start the note on touch start
  };

  const handleTouchMove = (index: number, e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.touches).find(
      (t) => keyStates.get(index)?.touchId === t.identifier
    );
    if (touch && keyStates.get(index)?.isPlaying) {
      handleMove(index, touch.clientX, touch.identifier); // Move the note on touch move
    }
  };

  const handleTouchEnd = (index: number, e: React.TouchEvent) => {
    e.preventDefault();
    const touch = Array.from(e.changedTouches).find(
      (t) => keyStates.get(index)?.touchId === t.identifier
    );
    if (touch) {
      handleEnd(index, touch.identifier); // End the note on touch end
    }
  };
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -100, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 100, behavior: "smooth" });
    }
  };

  // Helper function to check if the note is sharp (e.g., C#)
  const isSharp = (note: string) => note.includes("#");

  return (
    <div className="p-4 bg-white rounded shadow-lg w-full">
      <div
        ref={scrollRef}
        className="relative flex flex-nowrap gap-1 overflow-hidden touch-pan-x"
      >
        {noteNames.map((note, index) => {
          const state = keyStates.get(index);
          const offset = state?.smoothedOffset || 0;
          const keyWidth = isSharp(note) ? 48 : 80;
          const maxOffset = (2 * keyWidth) / 3;
          const rotation = (offset / maxOffset) * 0.7; // Maximum rotation of 0.7 degrees

          return (
            <div
              key={index}
              ref={(el) => {
                if (el) keyRefs.current[index] = el;
              }}
              className={`relative lg:flex-auto flex-none flex flex-col items-center justify-end cursor-pointer select-none ${
                isSharp(note)
                  ? "w-11 h-32 bg-black text-white z-10 -mx-6"
                  : "w-18 h-60 bg-gray-200 text-black"
              }`}
              onMouseDown={(e) => handleMouseDown(index, e)}
              onMouseMove={(e) => handleMouseMove(index, e)}
              onMouseUp={() => handleMouseUp(index)}
              onMouseLeave={() => handleMouseUp(index)}
              onTouchStart={(e) => handleTouchStart(index, e)}
              onTouchMove={(e) => handleTouchMove(index, e)}
              onTouchEnd={(e) => handleTouchEnd(index, e)}
            >
              <div
                className={`w-1 ${
                  isSharp(note) ? "h-28 bg-gray-300" : "h-56 bg-gray-400"
                }`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "center bottom",
                  transition: "transform 0.1s ease-out",
                }}
              />
              <span className="text-sm pb-2 italic font-serif">{note}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between w-full mt-2 lg:hidden">
        <button onClick={scrollLeft} className="px-4 py-2 bg-gray-300 rounded">
          ◀️
        </button>
        <button onClick={scrollRight} className="px-4 py-2 bg-gray-300 rounded">
          ▶️
        </button>
      </div>
    </div>
  );
};

export default Piano;
