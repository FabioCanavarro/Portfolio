"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Calendar, MapPin, ChevronDown, SlidersHorizontal, Eye, X, Layers, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
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
  category?: string;
  primary_type?: string;
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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [originalRatio, setOriginalRatio] = useState(true);
  const [activeProudIndex, setActiveProudIndex] = useState(0);


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

      // Category match
      const matchesCategory = selectedCategory === "all" || (photo.category || "Scenery").toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesTag && matchesCategory;
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
  }, [photos, searchQuery, selectedTag, selectedCategory, sortBy]);

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
      {/* Category Tab Bar Filter */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
        {["all", "scenery", "people", "buildings", "street", "others"].map((cat) => {
          const displayLabel = cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1);
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-mauve text-crust border-mauve shadow-lg shadow-mauve/20 scale-105"
                  : "bg-surface0/45 border-surface1/60 text-subtext1 hover:text-text hover:border-surface1"
              }`}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>

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

          <div className="relative w-full h-[320px] sm:h-[400px] md:h-[480px] flex items-center justify-center overflow-hidden py-4">
            {proudPhotos.length === 1 ? (
              // 1 proud photo fallback
              <div 
                onClick={() => setSelectedPhoto(proudPhotos[0])}
                className="relative w-[80%] md:w-[50%] h-full rounded-2xl overflow-hidden bg-black/60 border border-yellow/30 shadow-[0_0_20px_rgba(249,226,175,0.15)] cursor-pointer hover:border-yellow transition-all"
              >
                <img src={proudPhotos[0].edited} alt={proudPhotos[0].title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4">
                  <h3 className="text-base sm:text-lg font-bold text-text truncate">{proudPhotos[0].title}</h3>
                  <p className="text-xs text-subtext0 font-mono">📍 {proudPhotos[0].city || proudPhotos[0].country}</p>
                </div>
              </div>
            ) : proudPhotos.length === 2 ? (
              // 2 proud photos layout
              <div className="w-full h-full flex gap-4 justify-center items-center">
                {proudPhotos.map((photo) => (
                  <div 
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="relative w-[45%] h-[90%] rounded-2xl overflow-hidden bg-black/60 border border-yellow/20 hover:border-yellow cursor-pointer transition-all"
                  >
                    <img src={photo.edited} alt={photo.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <h3 className="text-sm sm:text-base font-bold text-text truncate">{photo.title}</h3>
                      <p className="text-[10px] text-subtext0 font-mono">📍 {photo.city || photo.country}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 3D Coverflow slider layout
              <>
                {/* Left Card (Previous) */}
                <div 
                  onClick={() => {
                    const prevIdx = (activeProudIndex - 1 + proudPhotos.length) % proudPhotos.length;
                    setActiveProudIndex(prevIdx);
                  }}
                  className="absolute left-[2%] sm:left-[10%] w-[25%] sm:w-[22%] h-[75%] sm:h-[80%] rounded-2xl overflow-hidden bg-black/40 border border-surface0/45 cursor-pointer filter blur-[2.5px] opacity-40 hover:opacity-60 transition-all duration-500 z-10 scale-90"
                  title="Previous Featured"
                >
                  <img src={proudPhotos[(activeProudIndex - 1 + proudPhotos.length) % proudPhotos.length].edited} alt="Previous" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30" />
                </div>

                {/* Left Navigation Click Overlay */}
                <button
                  onClick={() => {
                    const prevIdx = (activeProudIndex - 1 + proudPhotos.length) % proudPhotos.length;
                    setActiveProudIndex(prevIdx);
                  }}
                  className="absolute left-[2%] sm:left-[10%] w-[25%] sm:w-[22%] h-[75%] sm:h-[80%] z-30 opacity-0 cursor-pointer"
                  aria-label="Previous image"
                />

                {/* Center Focused Card */}
                <div 
                  onClick={() => setSelectedPhoto(proudPhotos[activeProudIndex])}
                  className="relative w-[46%] sm:w-[42%] h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black/60 border border-yellow/30 shadow-[0_0_30px_rgba(249,226,175,0.15)] cursor-pointer z-20 hover:scale-[1.02] hover:border-yellow/70 hover:shadow-[0_0_40px_rgba(249,226,175,0.25)] transition-all duration-500 flex flex-col justify-end"
                >
                  <img 
                    src={proudPhotos[activeProudIndex].edited} 
                    alt={proudPhotos[activeProudIndex].title} 
                    className="absolute inset-0 w-full h-full object-cover animate-fade-in" 
                    key={proudPhotos[activeProudIndex].id}
                  />
                  {/* Ambient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent z-10" />
                  
                  {/* Floating description details */}
                  <div className="relative p-4 sm:p-6 z-20 space-y-1 select-none">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-yellow font-bold bg-yellow/10 px-2 py-0.5 rounded border border-yellow/20">Featured Masterpiece</span>
                    <h3 className="text-base sm:text-xl font-black text-text drop-shadow-md truncate pt-1">{proudPhotos[activeProudIndex].title}</h3>
                    <p className="text-[10px] sm:text-xs text-subtext0 font-mono flex items-center gap-1 drop-shadow">
                      <span>📍</span>
                      <span>{proudPhotos[activeProudIndex].specific_location || [proudPhotos[activeProudIndex].city, proudPhotos[activeProudIndex].country].filter(Boolean).join(", ")}</span>
                    </p>
                  </div>

                  {/* Left / Right chevron indicators inside active card */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const prevIdx = (activeProudIndex - 1 + proudPhotos.length) % proudPhotos.length;
                      setActiveProudIndex(prevIdx);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/40 hover:bg-black/60 text-text rounded-full z-35 transition-transform active:scale-90 border border-surface1/20"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextIdx = (activeProudIndex + 1) % proudPhotos.length;
                      setActiveProudIndex(nextIdx);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-black/40 hover:bg-black/60 text-text rounded-full z-35 transition-transform active:scale-90 border border-surface1/20"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Right Navigation Click Overlay */}
                <button
                  onClick={() => {
                    const nextIdx = (activeProudIndex + 1) % proudPhotos.length;
                    setActiveProudIndex(nextIdx);
                  }}
                  className="absolute right-[2%] sm:right-[10%] w-[25%] sm:w-[22%] h-[75%] sm:h-[80%] z-30 opacity-0 cursor-pointer"
                  aria-label="Next image"
                />

                {/* Right Card (Next) */}
                <div 
                  onClick={() => {
                    const nextIdx = (activeProudIndex + 1) % proudPhotos.length;
                    setActiveProudIndex(nextIdx);
                  }}
                  className="absolute right-[2%] sm:right-[10%] w-[25%] sm:w-[22%] h-[75%] sm:h-[80%] rounded-2xl overflow-hidden bg-black/40 border border-surface0/45 cursor-pointer filter blur-[2.5px] opacity-40 hover:opacity-60 transition-all duration-500 z-10 scale-90"
                  title="Next Featured"
                >
                  <img src={proudPhotos[(activeProudIndex + 1) % proudPhotos.length].edited} alt="Next" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30" />
                </div>
              </>
            )}
          </div>
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
