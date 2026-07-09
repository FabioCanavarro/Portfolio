"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import PhotoCard from "./PhotoCard";
import Lightbox from "./Lightbox";

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

type Props = {
  photosByYear: Record<string, Photo[]>;
  sortedYears: string[];
};

export default function GalleryClient({ photosByYear, sortedYears }: Props) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <>
      <div className="space-y-20">
        {sortedYears.map((year) => (
          <div key={year} className="space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold text-text">{year}</h2>
              <div className="flex-1 h-px bg-surface0" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {photosByYear[year].map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onClick={() => setSelectedPhoto(photo)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <Lightbox
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
