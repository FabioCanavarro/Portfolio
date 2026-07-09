"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

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

export default function Lightbox({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const [isEdited, setIsEdited] = useState(true);
  const currentImage = isEdited ? photo.edited : photo.original;

  // Prevent scrolling when lightbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-base/90 backdrop-blur-xl p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-surface0/50 hover:bg-surface1 rounded-full text-text transition-colors z-[110]"
      >
        <X size={24} />
      </button>

      <div
        className="relative flex flex-col lg:flex-row w-full max-w-6xl max-h-full rounded-2xl overflow-hidden bg-crust border border-surface0 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Display */}
        <div className="relative flex-1 bg-black/50 overflow-hidden flex items-center justify-center max-h-[60vh] lg:max-h-none lg:w-2/3">
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
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setIsEdited(!isEdited)}
              className="flex items-center gap-2 bg-surface0/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-surface1 hover:bg-surface1 transition-colors shadow-lg"
            >
              <span className={`text-sm font-medium ${!isEdited ? "text-text" : "text-subtext0"}`}>Original</span>
              <div className="relative w-10 h-5 bg-crust rounded-full flex items-center px-0.5">
                <motion.div
                  layout
                  className="w-4 h-4 bg-mauve rounded-full"
                  animate={{ x: isEdited ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
              <span className={`text-sm font-medium ${isEdited ? "text-text" : "text-subtext0"}`}>Edited</span>
            </button>
          </div>
        </div>

        {/* Backstory & details */}
        <div className="w-full lg:w-1/3 p-6 lg:p-8 flex flex-col bg-crust overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text mb-2 tracking-tight">{photo.title}</h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-mono text-subtext0">
              {photo.date && (
                <span>
                  {new Date(photo.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              )}
              {photo.date && (photo.city || photo.country) && <span>•</span>}
              {(photo.city || photo.country) && (
                <span className="text-mauve font-medium" title={[photo.city, photo.province, photo.country].filter(Boolean).join(", ")}>
                  📍 {[photo.city, photo.country].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
          </div>
          
          <div className="space-y-6 flex-1 text-sm md:text-[1rem] md:leading-6 text-subtext1">
            <p className="leading-relaxed font-medium text-text bg-surface0/30 p-4 rounded-xl border border-surface0/50">
              &quot;{photo.description}&quot;
            </p>
            
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
      </div>
    </motion.div>
  );
}
