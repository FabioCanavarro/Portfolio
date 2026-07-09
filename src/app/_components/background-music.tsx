/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Music, Volume1, Volume2, VolumeX } from "lucide-react";

type TrackInfo = {
  title: string;
  artist: string;
  videoId: string;
  image?: string;
};

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMutedByUser, setIsMutedByUser] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<TrackInfo | null>(null);
  
  // Volume states
  const [volume, setVolume] = useState(50);
  const [prevVolume, setPrevVolume] = useState(50);

  // 1. Check Last.fm current scrobble status
  const checkNowPlaying = async () => {
    try {
      const res = await fetch("/api/music/now-playing");
      if (res.ok) {
        const data = await res.json();
        if (data.playing && data.videoId) {
          setNowPlaying({
            title: data.title,
            artist: data.artist,
            videoId: data.videoId,
            image: data.image
          });
        } else {
          setNowPlaying(null);
        }
      }
    } catch (e) {
      console.error("[BackgroundMusic] Failed check scrobble:", e);
    }
  };

  // 2. Poll scrobbler state on load and every 20 seconds
  useEffect(() => {
    checkNowPlaying();
    const interval = setInterval(checkNowPlaying, 20000);
    return () => clearInterval(interval);
  }, []);

  // 3. Initialize settings from localStorage (muted, volume)
  useEffect(() => {
    const savedMuted = localStorage.getItem("music_muted_by_user") === "true";
    setIsMutedByUser(savedMuted);

    const savedVolume = localStorage.getItem("music_volume");
    const initialVolume = savedVolume !== null ? Number(savedVolume) : 50;
    setVolume(initialVolume);
    setPrevVolume(initialVolume > 0 ? initialVolume : 50);

    if (savedMuted) {
      return;
    }

    // Try autoplay
    setIsPlaying(true);

    const startPlayback = () => {
      setIsPlaying(true);
    };

    window.addEventListener("click", startPlayback, { once: true });
    window.addEventListener("keydown", startPlayback, { once: true });
    window.addEventListener("touchstart", startPlayback, { once: true });

    return () => {
      window.removeEventListener("click", startPlayback);
      window.removeEventListener("keydown", startPlayback);
      window.removeEventListener("touchstart", startPlayback);
    };
  }, []);

  // 4. Load YouTube API script
  useEffect(() => {
    if (typeof window === "undefined") return;
    const win = window as any;

    if (!win.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // 5. Manage YouTube Player Instance
  useEffect(() => {
    if (typeof window === "undefined") return;
    const win = window as any;
    if (!nowPlaying?.videoId) return;

    const initPlayer = () => {
      if (!win.YT || !win.YT.Player || !nowPlaying?.videoId) return;

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.cueVideoById(nowPlaying.videoId);
          if (isPlaying && !isMutedByUser) {
            ytPlayerRef.current.playVideo();
          }
          return;
        } catch (e) {
          console.warn("[BackgroundMusic] cueVideoById error:", e);
        }
      }

      ytPlayerRef.current = new win.YT.Player("yt-player-placeholder", {
        height: "0",
        width: "0",
        videoId: nowPlaying.videoId,
        playerVars: {
          autoplay: isPlaying && !isMutedByUser ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume); // set to current volume level
            if (isPlaying && !isMutedByUser) {
              event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
            if (event.data === win.YT.PlayerState.ENDED) {
              event.target.playVideo(); // Loop song
            }
          }
        }
      });
    };

    if (win.YT && win.YT.Player) {
      initPlayer();
    } else {
      const prevCallback = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying?.videoId]);

  // 6. Sync volume changes directly to active players
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === "function") {
      try {
        ytPlayerRef.current.setVolume(volume);
      } catch (e) {}
    }
  }, [volume]);

  // 7. Coordinate playback states between Local Audio and YouTube
  useEffect(() => {
    const audio = audioRef.current;
    const ytPlayer = ytPlayerRef.current;
    const activePlay = isPlaying && !isMutedByUser;

    if (activePlay) {
      if (nowPlaying) {
        // Play YouTube scrobble track, pause local jazz
        if (audio && !audio.paused) {
          audio.pause();
        }
        if (ytPlayer && typeof ytPlayer.playVideo === "function") {
          try {
            ytPlayer.playVideo();
          } catch (e) {}
        }
      } else {
        // Play local jazz, pause YouTube
        if (ytPlayer && typeof ytPlayer.pauseVideo === "function") {
          try {
            ytPlayer.pauseVideo();
          } catch (e) {}
        }
        if (audio && audio.paused) {
          audio.play().catch((err) => console.log("Local audio blocked:", err));
        }
      }
    } else {
      // Paused or Muted
      if (audio && !audio.paused) {
        audio.pause();
      }
      if (ytPlayer && typeof ytPlayer.pauseVideo === "function") {
        try {
          ytPlayer.pauseVideo();
        } catch (e) {}
      }
    }
  }, [isPlaying, isMutedByUser, nowPlaying, nowPlaying?.videoId]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setIsMutedByUser(true);
      localStorage.setItem("music_muted_by_user", "true");
    } else {
      setIsPlaying(true);
      setIsMutedByUser(false);
      localStorage.setItem("music_muted_by_user", "false");
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    localStorage.setItem("music_volume", String(val));
    if (val > 0) {
      setPrevVolume(val);
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      handleVolumeChange(0);
    } else {
      handleVolumeChange(prevVolume > 0 ? prevVolume : 50);
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/jazz.mp3" loop preload="auto" />
      <div id="yt-player-placeholder" className="hidden" />

      {/* Floating Controller Widget */}
      <div className="fixed bottom-6 right-6 z-50 select-none pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 bg-crust/95 border border-surface0/60 hover:border-surface1 text-text rounded-full shadow-2xl backdrop-blur-md transition-all duration-300 group">
        
        {/* Play/Pause Toggle Action Area */}
        <div 
          onClick={togglePlay}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          {/* Animated visualizer OR spinning album art cover */}
          {nowPlaying?.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={nowPlaying.image}
              alt="Album cover"
              className={`w-5 h-5 rounded-full object-cover shrink-0 shadow-md transition-transform duration-[4000ms] ease-linear ${
                isPlaying ? "rotate-360 animate-[spin_6s_linear_infinite]" : ""
              }`}
            />
          ) : isPlaying ? (
            <div className="flex items-end gap-[2px] h-3.5 w-4 overflow-hidden mb-[1px] shrink-0">
              <span className="w-[2px] bg-mauve rounded-full animate-music-bar-1" />
              <span className="w-[2px] bg-mauve rounded-full animate-music-bar-2" />
              <span className="w-[2px] bg-mauve rounded-full animate-music-bar-3" />
            </div>
          ) : (
            <Music size={14} className="text-subtext0 group-hover:text-mauve transition-colors shrink-0" />
          )}

          {/* Controls title text */}
          <div className="flex flex-col items-start leading-none max-w-[120px] md:max-w-[180px] overflow-hidden">
            <span className="text-[7px] uppercase font-bold tracking-widest text-mauve mb-0.5">
              {nowPlaying ? "Now Playing" : "Playlist"}
            </span>
            <span className="text-[10px] font-bold text-subtext0 truncate w-full group-hover:text-text transition-colors">
              {nowPlaying ? `${nowPlaying.title} - ${nowPlaying.artist}` : "Background Jazz"}
            </span>
          </div>

          <span className="bg-surface0/80 p-1.5 rounded-full group-hover:bg-surface1 transition-colors shrink-0">
            {isPlaying ? (
              <Pause size={10} className="text-mauve fill-mauve" />
            ) : (
              <Play size={10} className="text-subtext1 fill-subtext1 translate-x-[0.5px]" />
            )}
          </span>
        </div>

        {/* Vertical Separator */}
        <div className="w-px h-5 bg-surface0/80 shrink-0" />

        {/* Volume controls */}
        <div className="flex items-center gap-1.5 group/volume shrink-0">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1 rounded-full hover:bg-surface0 text-subtext1 hover:text-text transition-colors cursor-pointer shrink-0"
            title={volume === 0 ? "Unmute" : "Mute"}
          >
            {volume === 0 ? (
              <VolumeX size={12} className="text-red" />
            ) : volume < 40 ? (
              <Volume1 size={12} className="text-subtext1" />
            ) : (
              <Volume2 size={12} className="text-mauve" />
            )}
          </button>
          
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-0 group-hover/volume:w-16 h-1 bg-surface0 rounded-lg appearance-none cursor-pointer transition-all duration-300 outline-none accent-mauve hover:bg-surface1"
            title="Adjust volume"
          />
        </div>
      </div>
    </>
  );
}
