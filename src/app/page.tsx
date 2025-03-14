"use client";

import { useEffect } from "react";
import Piano from "@/components/Piano";
import Image from "next/image";
import Hotjar from "@hotjar/browser";

const siteId = 5332348;
const hotjarVersion = 6;

Hotjar.init(siteId, hotjarVersion);

export default function VibratoPiano() {
  useEffect(() => {
    // Prevents the context menu from appearing when right-clicking
    const preventContextMenu = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);
    return () =>
      document.removeEventListener("contextmenu", preventContextMenu);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4 text-center text-gray-800 hidden lg:block">
        Vibrato Piano
      </h1>
      <Piano />
      <div className="flex flex-col items-center m-6 max-w-3xl">
        <p className="text-lg text-gray-600 text-center md:text-left leading-relaxed mb-6">
          A virtual piano that allows you to adjust the note frequency by
          dragging the mouse or finger within the key, creating effects like
          note variations and vibrato.
          <br />
          This is a personal project born from the lack of simple and intuitive
          platforms to simulate note variations.
        </p>
        <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-6">
          <Image
            src="/koto/1200px-Japanese_Koto.jpg"
            alt="Japanese Koto"
            width={200}
            height={150}
            className="mb-4 md:mb-0 md:w-1/3"
          />
          <p className="text-lg text-gray-600 text-center md:text-left leading-relaxed md:w-2/3">
            Inspired by the sound of the Japanese harp koto (箏), a traditional
            instrument whose strings are pressed to create subtle pitch
            variations and effects like vibrato – now, you can explore this
            unique sound with ease.
          </p>
        </div>
      </div>
    </div>
  );
}
