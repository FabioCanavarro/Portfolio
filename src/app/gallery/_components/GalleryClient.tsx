"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Calendar, MapPin, ChevronDown, SlidersHorizontal, Eye, X, Layers, Sparkles } from "lucide-react";
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
  specific_location?: string;
  proud?: boolean;
  variations?: string[];
};

type Props = {
  photos: Photo[];
};

type SortOption = "date-desc" | "date-asc" | "city" | "province" | "country" | "title";

interface MasonryGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
  originalRatio: boolean;
}

function MasonryGrid({ photos, onPhotoClick, originalRatio }: MasonryGridProps) {
  const { cols3, cols2 } = useMemo(() => {
    const cols3: Photo[][] = [[], [], []];
    const cols2: Photo[][] = [[], []];
    photos.forEach((photo, idx) => {
      cols3[idx % 3].push(photo);
      cols2[idx % 2].push(photo);
    });
    return { cols3, cols2 };
  }, [photos]);

  if (!originalRatio) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {photos.map((photo) => (
          <div key={photo.id} className="w-full">
            <PhotoCard photo={photo} onClick={() => onPhotoClick(photo)} originalRatio={false} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Masonry (3 cols) */}
      <div className="hidden lg:grid grid-cols-3 gap-8 items-start">
        {cols3.map((colPhotos, colIdx) => (
          <div key={`col3-${colIdx}`} className="flex flex-col gap-8">
            {colPhotos.map((photo) => (
              <div key={photo.id} className="w-full">
                <PhotoCard photo={photo} onClick={() => onPhotoClick(photo)} originalRatio={true} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Tablet Masonry (2 cols) */}
      <div className="hidden md:grid lg:hidden grid-cols-2 gap-8 items-start">
        {cols2.map((colPhotos, colIdx) => (
          <div key={`col2-${colIdx}`} className="flex flex-col gap-8">
            {colPhotos.map((photo) => (
              <div key={photo.id} className="w-full">
                <PhotoCard photo={photo} onClick={() => onPhotoClick(photo)} originalRatio={true} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Mobile Masonry (1 col) */}
      <div className="grid md:hidden grid-cols-1 gap-8">
        {photos.map((photo) => (
          <div key={photo.id} className="w-full">
            <PhotoCard photo={photo} onClick={() => onPhotoClick(photo)} originalRatio={true} />
          </div>
        ))}
      </div>
    </>
  );
}

export default function GalleryClient({ photos }: Props) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
  // Search, filter, and sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [originalRatio, setOriginalRatio] = useState(true);


  const proudPhotos = useMemo(() => {
    // Only display active published photos in the proud section, limit to 10
    return photos.filter((p) => p.published && p.proud).slice(0, 10);
  }, [photos]);

  // Sync state from client localStorage after hydration to prevent SSR mismatch
  useEffect(() => {
    const saved = localStorage.getItem("gallery_original_ratio");
    if (saved !== null) {
      setOriginalRatio(saved === "true");
    } else {
      setOriginalRatio(true);
    }
  }, []);

  const handleToggleOriginalRatio = () => {
    setOriginalRatio((prev) => {
      const next = !prev;
      localStorage.setItem("gallery_original_ratio", String(next));
      return next;
    });
  };

  // Extract all unique tags for the filter dropdown
  const uniqueTags = useMemo(() => {
    const tagsSet = new Set<string>();
    photos.forEach((photo) => {
      if (Array.isArray(photo.tags)) {
        photo.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return ["all", ...Array.from(tagsSet).sort()];
  }, [photos]);

  // Perform filtering and sorting
  const processedPhotos = useMemo(() => {
    // 1. Filter
    const result = photos.filter((photo) => {
      // Search query match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !query ||
        photo.title?.toLowerCase().includes(query) ||
        photo.description?.toLowerCase().includes(query) ||
        photo.backstory?.toLowerCase().includes(query) ||
        photo.city?.toLowerCase().includes(query) ||
        photo.province?.toLowerCase().includes(query) ||
        photo.country?.toLowerCase().includes(query) ||
        photo.tags?.some((t) => t.toLowerCase().includes(query));

      // Tag match
      const matchesTag = selectedTag === "all" || photo.tags?.includes(selectedTag);

      return matchesSearch && matchesTag;
    });

    // 2. Sort
    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === "city") {
        const cityA = a.city || "zzz";
        const cityB = b.city || "zzz";
        return cityA.localeCompare(cityB);
      }
      if (sortBy === "province") {
        const provA = a.province || "zzz";
        const provB = b.province || "zzz";
        return provA.localeCompare(provB);
      }
      if (sortBy === "country") {
        const countryA = a.country || "zzz";
        const countryB = b.country || "zzz";
        return countryA.localeCompare(countryB);
      }
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      return 0;
    });

    return result;
  }, [photos, searchQuery, selectedTag, sortBy]);

  // Lightbox active navigation lists
  const activePhotosList = useMemo(() => {
    if (!selectedPhoto) return [];
    const inProcessed = processedPhotos.findIndex(p => p.id === selectedPhoto.id);
    if (inProcessed !== -1) {
      return processedPhotos;
    }
    return proudPhotos;
  }, [selectedPhoto, processedPhotos, proudPhotos]);

  const handlePrevPhoto = () => {
    if (!selectedPhoto || activePhotosList.length <= 1) return;
    const currentIndex = activePhotosList.findIndex(p => p.id === selectedPhoto.id);
    const prevIndex = (currentIndex - 1 + activePhotosList.length) % activePhotosList.length;
    setSelectedPhoto(activePhotosList[prevIndex]);
  };

  const handleNextPhoto = () => {
    if (!selectedPhoto || activePhotosList.length <= 1) return;
    const currentIndex = activePhotosList.findIndex(p => p.id === selectedPhoto.id);
    const nextIndex = (currentIndex + 1) % activePhotosList.length;
    setSelectedPhoto(activePhotosList[nextIndex]);
  };

  // Group photos dynamically based on sort criteria
  const groupedPhotos = useMemo(() => {
    const groups: { name: string; photos: Photo[] }[] = [];
    const groupMap = new Map<string, Photo[]>();

    processedPhotos.forEach((photo) => {
      let groupName = "Moments";
      
      if (sortBy === "date-desc" || sortBy === "date-asc") {
        if (photo.date) {
          const d = new Date(photo.date);
          if (!isNaN(d.getTime())) {
            // Group by Month Year
            groupName = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
          }
        }
      } else if (sortBy === "city") {
        groupName = photo.city || "Unknown City";
      } else if (sortBy === "province") {
        groupName = photo.province || "Unknown Province";
      } else if (sortBy === "country") {
        groupName = photo.country || "Unknown Country";
      } else if (sortBy === "title") {
        groupName = photo.title ? photo.title.substring(0, 1).toUpperCase() : "#";
      }

      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, []);
        groups.push({ name: groupName, photos: groupMap.get(groupName)! });
      }
      groupMap.get(groupName)!.push(photo);
    });

    return groups;
  }, [processedPhotos, sortBy]);

  return (
    <div className="space-y-12">
      {/* Control Panel */}
      <div className="bg-crust/50 border border-surface0/70 p-5 rounded-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-overlay0" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface0/60 border border-surface1/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-overlay0 outline-none focus:border-mauve transition-colors"
            placeholder="Search by title, location, tags..."
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-overlay0 hover:text-text transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Tag Filter */}
          <div className="relative flex-1 sm:flex-initial">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-overlay0 pointer-events-none" size={16} />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full bg-surface0/60 border border-surface1/60 rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-text appearance-none outline-none focus:border-mauve cursor-pointer"
            >
              <option value="all">All Tags</option>
              {uniqueTags.filter(t => t !== "all").map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-overlay0 pointer-events-none" size={14} />
          </div>

          {/* Sort By */}
          <div className="relative flex-1 sm:flex-initial">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 text-overlay0 pointer-events-none" size={16} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-surface0/60 border border-surface1/60 rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-text appearance-none outline-none focus:border-mauve cursor-pointer"
            >
              <option value="date-desc">📅 Date (Newest)</option>
              <option value="date-asc">⏳ Date (Oldest)</option>
              <option value="city">📍 City (A-Z)</option>
              <option value="province">🗺️ Province (A-Z)</option>
              <option value="country">🏳️ Country (A-Z)</option>
              <option value="title">🔤 Title (A-Z)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-overlay0 pointer-events-none" size={14} />
          </div>

          {/* Layout Mode (Original Ratio Toggle) */}
          <button
            type="button"
            onClick={handleToggleOriginalRatio}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none active:scale-[0.98] ${
              originalRatio
                ? "bg-mauve/25 border-mauve text-mauve shadow-lg shadow-mauve/5"
                : "bg-surface0/60 border-surface1/60 text-subtext1 hover:border-surface1 hover:text-text"
            }`}
            title="Toggle original aspect ratio vs fixed cropped ratio grid"
          >
            <Layers size={14} />
            <span>Original Ratio</span>
          </button>
        </div>
      </div>

      {/* Proud Selection / Featured Section */}
      {proudPhotos.length > 0 && (
        <div className="space-y-6 bg-surface0/10 p-6 rounded-3xl border border-surface0/45 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-yellow/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <Sparkles className="text-yellow fill-yellow animate-pulse" size={20} />
            <h2 className="text-xl font-bold text-text">Featured Masterpieces</h2>
            <div className="flex-1 h-px bg-surface0/45" />
            <span className="text-[10px] text-subtext0 font-mono tracking-widest uppercase">Proud Selection</span>
          </div>

          <MasonryGrid
            photos={proudPhotos}
            onPhotoClick={setSelectedPhoto}
            originalRatio={originalRatio}
          />
        </div>
      )}

      {/* Grid Display */}
      {groupedPhotos.length === 0 ? (
        <div className="text-center py-20 bg-crust/20 border border-surface0/50 rounded-2xl">
          <p className="text-subtext0">No photos match your filters.</p>
        </div>
      ) : (
        <motion.div layout className="space-y-16">
          {groupedPhotos.map((group) => (
            <motion.div layout key={group.name} className="space-y-6">
              {/* Group Header */}
              <motion.div layout className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-text shrink-0">{group.name}</h2>
                <div className="flex-1 h-px bg-surface0/60" />
                <span className="text-xs text-subtext0 font-mono font-medium">
                  {group.photos.length} {group.photos.length === 1 ? "photo" : "photos"}
                </span>
              </motion.div>
              
              {/* Group Photos */}
              <motion.div layout>
                <AnimatePresence mode="popLayout">
                  <MasonryGrid
                    photos={group.photos}
                    onPhotoClick={setSelectedPhoto}
                    originalRatio={originalRatio}
                  />
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Lightbox modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <Lightbox
            photo={selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            onPrev={activePhotosList.length > 1 ? handlePrevPhoto : undefined}
            onNext={activePhotosList.length > 1 ? handleNextPhoto : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
