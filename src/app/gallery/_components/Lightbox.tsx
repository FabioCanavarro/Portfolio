"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

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
  variations?: string[];
  category?: string;
  primary_type?: string;
};

export default function Lightbox({ 
  photo, 
  onClose,
  onPrev,
  onNext
}: { 
  photo: Photo; 
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Reset active index to edited version when photo changes
  useEffect(() => {
    setActiveVersionIndex(0);
  }, [photo]);

  // Prevent scrolling when lightbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Keyboard navigation listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  // Sync state with HTML5 fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-base/95 backdrop-blur-xl p-0 sm:p-4 md:p-8"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-surface0/50 hover:bg-surface1 rounded-full text-text transition-colors z-[120] cursor-pointer"
        title="Close Lightbox (Escape)"
      >
        <X size={24} />
      </button>

      {/* Left Arrow Button */}
      {onPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-surface0/60 hover:bg-surface1 hover:scale-105 active:scale-95 text-text rounded-full transition-all z-[110] border border-surface1/60 shadow-lg shadow-black/20 group cursor-pointer hidden md:block"
          title="Previous Image (Arrow Left)"
        >
          <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Right Arrow Button */}
      {onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-surface0/60 hover:bg-surface1 hover:scale-105 active:scale-95 text-text rounded-full transition-all z-[110] border border-surface1/60 shadow-lg shadow-black/20 group cursor-pointer hidden md:block"
          title="Next Image (Arrow Right)"
        >
          <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Main Container */}
      <div
        className={`relative flex flex-col lg:flex-row w-full overflow-hidden transition-all duration-300 ${
          isFullscreen 
            ? "w-screen h-screen max-w-none max-h-none border-none bg-black rounded-none" 
            : "max-w-5xl max-h-[85vh] lg:max-h-[90vh] rounded-2xl bg-crust border border-surface0 shadow-2xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Swipe Buttons (overlay) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none md:hidden z-30">
          {onPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="pointer-events-auto p-2 bg-surface0/80 text-text rounded-full border border-surface1/55"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {onNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="pointer-events-auto p-2 bg-surface0/80 text-text rounded-full border border-surface1/55"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Image Display */}
        <div className={`relative shrink-0 bg-black/50 overflow-hidden flex items-center justify-center transition-all ${
          isFullscreen 
            ? "w-full h-full lg:w-full lg:h-full" 
            : "w-full lg:w-2/3 h-[40vh] sm:h-[48vh] lg:h-auto"
        }`}>
          <motion.img
            key={currentImage}
            src={currentImage}
            alt={photo.title}
            className="w-full h-full object-contain"
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          />

          {/* Toggle inside Lightbox */}
          {versions.length > 1 ? (
            <div className="absolute top-4 right-4 z-20">
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-surface1/60 shadow-lg">
                {versions.map((ver, idx) => (
                  <button
                    key={ver.name}
                    type="button"
                    onClick={() => setActiveVersionIndex(idx)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeVersionIndex === idx
                        ? "bg-mauve text-crust shadow-md shadow-mauve/15"
                        : "text-subtext1 hover:text-text hover:bg-surface0/40"
                    }`}
                  >
                    {ver.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="absolute top-4 right-4 z-20">
              {photo.primary_type === "original" ? (
                <span className="px-3 py-1.5 text-xs font-bold tracking-wider uppercase border rounded-lg bg-teal/25 text-teal border-teal/45 shadow-[0_0_15px_rgba(148,226,213,0.25)]">
                  Original
                </span>
              ) : (
                <span className="px-3 py-1.5 text-xs font-bold tracking-wider uppercase border rounded-lg bg-mauve/25 text-mauve border-mauve shadow-[0_0_15px_rgba(202,158,230,0.25)]">
                  Edited
                </span>
              )}
            </div>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleNativeFullscreen();
            }}
            className="absolute top-4 left-4 p-2 bg-black/60 hover:bg-black/80 text-text rounded-lg border border-surface1/60 shadow-lg cursor-pointer z-30 transition-transform hover:scale-105 active:scale-95"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Photo"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        {/* Backstory & details */}
        {!isFullscreen && (
          <div className="w-full lg:w-1/3 p-6 lg:p-8 flex flex-col bg-crust overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-text mb-3 tracking-tight">{photo.title}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm font-mono text-subtext0">
                <span className="bg-surface0 border border-surface1 px-2.5 py-1 text-xs rounded-lg text-mauve font-bold shrink-0">
                  📁 {photo.category || "Scenery"}
                </span>
                {photo.date && (
                  <span>
                    {new Date(photo.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
                {photo.date && (photo.city || photo.country || photo.specific_location) && <span>•</span>}
                {(photo.city || photo.country || photo.specific_location) && (
                  <span className="text-mauve font-medium" title={[photo.specific_location, photo.city, photo.province, photo.country].filter(Boolean).join(", ")}>
                    📍 {photo.specific_location || [photo.city, photo.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-6 flex-1 text-sm md:text-[1rem] md:leading-6 text-subtext1">
              {photo.specific_location && (
                <div className="bg-surface0/20 p-3 rounded-xl border border-surface0/60 text-xs font-mono flex flex-col gap-1.5">
                  <span className="font-bold text-mauve uppercase tracking-widest text-[8px]">Specific Location Note</span>
                  <span>{photo.specific_location}</span>
                </div>
              )}
              
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-mauve mb-2">Backstory</h4>
                <p className="leading-relaxed">
                  {photo.backstory}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2 pt-6 border-t border-surface0">
              {photo.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-surface0 text-subtext1 border border-surface1/30"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
