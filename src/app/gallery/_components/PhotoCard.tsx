"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

type Photo = {
  id: string;
  title: string;
  description: string;
  backstory: string;
  date: string;
  year: string;
  tags: string[];
  original: string;
  edited: string;
  city?: string;
  province?: string;
  country?: string;
  published?: boolean;
  specific_location?: string;
  proud?: boolean;
  width?: number;
  height?: number;
  variations?: string[];
};

export default function PhotoCard({ 
  photo, 
  onClick,
  originalRatio = false
}: { 
  photo: Photo; 
  onClick: () => void;
  originalRatio?: boolean;
}) {
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Parse versions (Edited, Original, and Variations)
  const versions = useMemo(() => {
    const list = [
      { name: "Edited", url: photo.edited }
    ];
    if (photo.original && photo.original !== photo.edited) {
      list.push({ name: "Original", url: photo.original });
    }
    if (photo.variations && photo.variations.length > 0) {
      photo.variations.forEach((url, idx) => {
        list.push({ name: `V${idx + 1}`, url });
      });
    }
    return list;
  }, [photo]);

  const currentImage = versions[activeVersionIndex]?.url || photo.edited;

  useEffect(() => {
    setImageLoaded(false);
    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
    }
  }, [currentImage]);

  const hasResolution = photo.width && photo.height;
  const imageAspectRatio = hasResolution ? `${photo.width} / ${photo.height}` : "4 / 3";
  const containerStyle = originalRatio && hasResolution ? { aspectRatio: imageAspectRatio } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col cursor-pointer w-full"
      onClick={onClick}
    >
      {/* Ambient Glow Background */}
      <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-110 pointer-events-none">
        <div 
          className="absolute -inset-6 bg-cover bg-center blur-3xl opacity-60 transition-opacity duration-700 group-hover:opacity-95 rounded-2xl"
          style={{ backgroundImage: `url(${currentImage})` }}
        />
      </div>

      {/* Main Card with Animated Border */}
      <div className="hover-border-animated-wrapper w-full h-full relative z-10">
        <div className="hover-border-animated-inner bg-crust/95 backdrop-blur-md overflow-hidden flex flex-col h-full transition-all duration-300 border border-surface0/50 group-hover:border-transparent">
        
        {/* Top Section - Title and Toggle */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
          <h3 className="text-lg font-bold text-white drop-shadow-md pr-2 truncate">
            {photo.title}
          </h3>
          
          {versions.length > 1 ? (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm p-0.5 rounded-lg border border-surface1/60 z-30 shrink-0">
              {versions.map((ver, idx) => (
                <button
                  key={ver.name}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveVersionIndex(idx);
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    activeVersionIndex === idx
                      ? "bg-mauve text-crust shadow-md shadow-mauve/15"
                      : "text-subtext1 hover:text-text hover:bg-surface0/40"
                  }`}
                >
                  {ver.name}
                </button>
              ))}
            </div>
          ) : (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase border rounded-md bg-mauve/25 text-mauve border-mauve/45 shadow-[0_0_12px_rgba(202,158,230,0.15)] shrink-0">
              Edited
            </span>
          )}
        </div>

        {/* Image Container */}
        <div 
          className={`relative w-full overflow-hidden bg-black/20 ${originalRatio ? "" : "aspect-[4/3]"}`}
          style={containerStyle}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 bg-surface0/60 animate-pulse flex items-center justify-center z-10" />
          )}
          
          <motion.img
            ref={imgRef}
            key={currentImage}
            src={currentImage}
            alt={photo.title}
            onLoad={() => setImageLoaded(true)}
            className={`w-full transition-transform duration-700 ease-out group-hover:scale-105 ${originalRatio ? "h-auto" : "h-full object-cover"}`}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Bottom Section - Tags */}
        <div className="p-5 flex flex-col flex-1 bg-gradient-to-t from-crust via-crust/95 to-crust/90">
          
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {photo.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs rounded-full bg-surface0 text-subtext1 border border-surface1/50"
                >
                  #{tag}
                </span>
              ))}
              {photo.tags.length > 3 && (
                <span className="px-2 py-1 text-xs rounded-full bg-surface0 text-subtext1 border border-surface1/50">
                  +{photo.tags.length - 3}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end text-right font-sans">
              {photo.date && (
                <span className="text-xs text-subtext0 font-mono">
                  {new Date(photo.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              )}
              {photo.city && photo.country ? (
                <span className="text-[10px] text-mauve font-semibold mt-0.5">
                  {photo.city}, {photo.country}
                </span>
              ) : photo.country ? (
                <span className="text-[10px] text-mauve font-semibold mt-0.5">
                  {photo.country}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        </div>
      </div>
    </motion.div>
  );
}
