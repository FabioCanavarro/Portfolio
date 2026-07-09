"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Music } from "lucide-react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMutedByUser, setIsMutedByUser] = useState(false);

  useEffect(() => {
    // 1. Initial State Check from localStorage
    const savedMuted = localStorage.getItem("music_muted_by_user") === "true";
    setIsMutedByUser(savedMuted);

    const audio = audioRef.current;
    if (!audio) return;

    // Set 10% volume
    audio.volume = 0.1;

    if (savedMuted) {
      console.log("Music muted by user preference. Skipping autoplay.");
      return;
    }

    // 2. Playback logic
    const attemptPlay = () => {
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          console.log("Autoplay blocked. Registering interaction listeners.");
          // Setup interaction triggers
          window.addEventListener("click", startPlayback, { once: true });
          window.addEventListener("keydown", startPlayback, { once: true });
          window.addEventListener("touchstart", startPlayback, { once: true });
        });
    };

    const startPlayback = () => {
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => console.error("Delayed playback failed:", err));
    };

    attemptPlay();

    return () => {
      window.removeEventListener("click", startPlayback);
      window.removeEventListener("keydown", startPlayback);
      window.removeEventListener("touchstart", startPlayback);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setIsMutedByUser(true);
      localStorage.setItem("music_muted_by_user", "true");
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setIsMutedByUser(false);
          localStorage.setItem("music_muted_by_user", "false");
        })
        .catch((err) => console.error("Playback start failed:", err));
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/jazz.mp3" loop preload="auto" />
      
      {/* Floating Controller Widget */}
      <div className="fixed bottom-6 right-6 z-50 select-none pointer-events-auto">
        <button
          type="button"
          onClick={togglePlay}
          className={`flex items-center gap-2 px-3 py-2 bg-crust/90 hover:bg-surface0 border border-surface0/60 hover:border-surface1 text-text rounded-full shadow-2xl backdrop-blur-md transition-all active:scale-[0.98] group cursor-pointer`}
          title={isPlaying ? "Mute Background Jazz" : "Play Background Jazz"}
        >
          {/* Animated music visualizer bars */}
          {isPlaying ? (
            <div className="flex items-end gap-[2px] h-3.5 w-4 overflow-hidden mb-[1px] shrink-0">
              <span className="w-[2px] bg-mauve rounded-full animate-music-bar-1" />
              <span className="w-[2px] bg-mauve rounded-full animate-music-bar-2" />
              <span className="w-[2px] bg-mauve rounded-full animate-music-bar-3" />
            </div>
          ) : (
            <Music size={14} className="text-subtext0 group-hover:text-mauve transition-colors shrink-0" />
          )}

          {/* Controls indicators */}
          <span className="text-[10px] uppercase font-bold tracking-wider text-subtext0 pr-1">
            Jazz
          </span>

          <span className="bg-surface0/60 p-1 rounded-full group-hover:bg-surface1 transition-colors">
            {isPlaying ? (
              <Pause size={10} className="text-mauve fill-mauve" />
            ) : (
              <Play size={10} className="text-subtext1 fill-subtext1 translate-x-[0.5px]" />
            )}
          </span>
        </button>
      </div>
    </>
  );
}
