"use client";

import { useState } from "react";
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
  const [isEdited, setIsEdited] = useState(true);
  const currentImage = isEdited ? photo.edited : photo.original;

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
          <h3 className="text-lg font-bold text-white drop-shadow-md pr-2">
            {photo.title}
          </h3>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEdited(!isEdited);
            }}
            className="flex items-center gap-1 bg-surface0/80 backdrop-blur-sm px-2 py-1 rounded-md border border-surface1 hover:bg-surface1 transition-colors z-30"
          >
            <span className={`text-xs font-medium ${!isEdited ? "text-text" : "text-subtext0"}`}>Orig</span>
            <div className="relative w-8 h-4 bg-crust rounded-full flex items-center px-0.5">
              <motion.div
                layout
                className="w-3 h-3 bg-mauve rounded-full"
                animate={{ x: isEdited ? 16 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
            <span className={`text-xs font-medium ${isEdited ? "text-text" : "text-subtext0"}`}>Edit</span>
          </button>
        </div>

        {/* Image Container */}
        <div className={`relative w-full overflow-hidden bg-black/20 ${originalRatio ? "h-auto" : "aspect-[4/3]"}`}>
          <motion.img
            key={currentImage}
            src={currentImage}
            alt={photo.title}
            className={`w-full transition-transform duration-700 ease-out group-hover:scale-105 ${originalRatio ? "h-auto" : "h-full object-cover"}`}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Bottom Section - Desc and Tags */}
        <div className="p-5 flex flex-col flex-1 bg-gradient-to-t from-crust via-crust/95 to-crust/90">
          <p className="text-subtext0 text-sm mb-4 line-clamp-2">
            {photo.description}
          </p>
          
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
            <div className="flex flex-col items-end text-right">
              {photo.date && (
                <span className="text-xs text-subtext0 font-mono">
                  {new Date(photo.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </span>
              )}
              {(photo.city || photo.country) && (
                <span className="text-[10px] text-mauve/80 font-mono mt-0.5 truncate max-w-[120px]" title={[photo.city, photo.province, photo.country].filter(Boolean).join(", ")}>
                  📍 {[photo.city, photo.country].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
