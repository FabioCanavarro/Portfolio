"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, Headphones, Activity, Code, Circle } from "lucide-react";
import Image from "next/image";

// You can inject this via .env.local or hardcode it
// IMPORTANT: Put your REAL 18-digit Discord ID here, otherwise lanyard will hang or error out!
const DISCORD_ID = (process.env.NEXT_PUBLIC_DISCORD_ID || "123456789012345678").trim();

export default function DiscordPresence() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (DISCORD_ID === "123456789012345678") {
      setIsLoading(false);
      return;
    }

    const fetchLanyard = async () => {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        if (!res.ok) throw new Error("Not okay");
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanyard();
    const interval = setInterval(fetchLanyard, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  console.log("Discord Lanyard Debug:", {
    discordId: DISCORD_ID,
    isLoading,
    hasData: !!data,
    error,
    data
  });

  if (DISCORD_ID === "123456789012345678") {
    return (
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 bg-crust/50 border border-surface0 rounded-2xl p-4 w-fit mx-auto mt-8 text-subtext0">
        <span className="text-sm font-medium">Please add NEXT_PUBLIC_DISCORD_ID to .env.local</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 bg-crust/50 border border-red/50 rounded-2xl p-4 w-fit mx-auto mt-8 text-red">
        <span className="text-sm font-medium">Failed to connect to Discord Lanyard. Did you join their server?</span>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center space-x-3 bg-crust/50 border border-surface0 rounded-2xl p-4 w-fit mx-auto mt-8 animate-pulse text-subtext0">
        <Circle className="w-5 h-5 text-surface1" fill="currentColor" />
        <span className="text-sm font-medium">Connecting to Discord...</span>
      </div>
    );
  }

  // Activity Status Colors
  const statusColorMap: Record<string, string> = {
    online: "text-green",
    idle: "text-yellow",
    dnd: "text-red",
    offline: "text-overlay0",
  };
  
  const statusColor = statusColorMap[data.discord_status] || "text-overlay0";

  // Parse Activities
  const spotify = data.spotify;
  // Fallback to first regular activity if not Spotify
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activity = data.activities?.find((a: any) => a.type !== 4); // Exclude custom status

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 bg-crust/50 backdrop-blur-md border border-surface0 shadow-lg shadow-crust/50 rounded-2xl p-4 w-fit transition-colors hover:border-surface1"
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-surface0 bg-surface1 relative">
          <Image 
            src={`https://cdn.discordapp.com/avatars/${data.discord_user.id}/${data.discord_user.avatar}.png`} 
            alt={data.discord_user.username}
            fill
            className="object-cover"
          />
        </div>
        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 bg-crust rounded-full flex items-center justify-center`}>
          <Circle className={`w-2.5 h-2.5 ${statusColor}`} fill="currentColor" />
        </div>
      </div>

      <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
        {spotify ? (
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5 text-green">
              <Headphones className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Listening to Spotify</span>
            </div>
            <p className="text-text font-semibold text-sm max-w-[200px] truncate">{spotify.song}</p>
            <p className="text-subtext0 text-xs max-w-[200px] truncate">by {spotify.artist}</p>
          </div>
        ) : activity ? (
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5 text-mauve">
              {activity.name === "Visual Studio Code" ? (
                <Code className="w-4 h-4" />
              ) : (
                <Gamepad2 className="w-4 h-4" />
              )}
              <span className="text-xs font-bold uppercase tracking-wider">
                {activity.type === 0 ? "Playing" : "Activity"}
              </span>
            </div>
            <p className="text-text font-semibold text-sm max-w-[200px] truncate">{activity.name}</p>
            {activity.details && (
              <p className="text-subtext0 text-xs max-w-[200px] truncate">{activity.details}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col justify-center h-full">
            <div className="flex items-center space-x-1.5 text-subtext1">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">{data.discord_status === 'offline' ? 'Offline' : 'Chilling'}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
