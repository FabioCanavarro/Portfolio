"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import Image from "next/image";

const API_BASE = "https://ws.audioscrobbler.com/2.0/";
const API_KEY = (process.env.NEXT_PUBLIC_LASTFM_API_KEY || "").trim();
const USERNAME = (process.env.NEXT_PUBLIC_LASTFM_USERNAME || "").trim();

export default function LastfmPresence() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!API_KEY || !USERNAME) {
      setIsLoading(false);
      return;
    }

    const fetchLastfm = async () => {
      try {
        const url = `${API_BASE}?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Not okay");
        const json = await res.json();
        
        if (json.recenttracks && json.recenttracks.track.length > 0) {
          const track = json.recenttracks.track[0];
          const isPlaying = track["@attr"]?.nowplaying === "true";
          const fallbackImage = track.image[3]["#text"] || track.image[2]["#text"];
          const artist = track.artist["#text"];
          const name = track.name;

          let image = fallbackImage;
          if (isPlaying) {
            try {
              const ytRes = await fetch(`/api/ytmusic-image?q=${encodeURIComponent(artist + " " + name)}&type=SONG`);
              if (ytRes.ok) {
                const ytData = await ytRes.json();
                if (ytData.imageUrl) image = ytData.imageUrl;
              }
            } catch {
              // ignore
            }
          }

          setData({
             name: name,
             artist: artist,
             image,
             isPlaying,
             url: track.url
          });
          setError(false);
        } else {
          setData(null);
        }
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLastfm();
    const interval = setInterval(fetchLastfm, 15000); // 15s polling
    return () => clearInterval(interval);
  }, []);

  if (!API_KEY || !USERNAME || error || isLoading || !data || !data.isPlaying) return null;

  return (
    <motion.a 
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 bg-crust/50 backdrop-blur-md border border-surface0 shadow-lg shadow-crust/50 rounded-2xl p-4 w-fit transition-colors hover:border-sapphire/50"
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-surface0 bg-surface1 shrink-0 shadow-sm">
        <Image 
          src={data.image || "/images/placeholder-music.jpg"} 
          alt={data.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
        <div className="flex items-center space-x-1.5 text-sapphire">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">Now Playing</span>
        </div>
        <p className="text-text font-semibold text-sm max-w-[200px] truncate">{data.name}</p>
        <p className="text-subtext0 text-xs max-w-[200px] truncate">{data.artist}</p>
      </div>
    </motion.a>
  );
}
