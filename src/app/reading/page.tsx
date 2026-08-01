"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Sparkles, Flame, Bookmark, ArrowLeft, Quote, MessageSquareText, AlertTriangle } from "lucide-react";

type ItemType = "NOVEL" | "MANHWA";

interface ReadingItem {
  id: string;
  title: string;
  originalTitle?: string;
  author?: string;
  type: ItemType;
  category: string;
  rank: number;
  isTopThree: boolean;
  progress: string;
  status: "Reading" | "Completed" | "Caught Up" | "On Hold";
  cover?: string;
  rating: string;
  quote?: string;
  quoteContext?: string;
  personalThoughts?: string;
  tags: string[];
  accentColor: string;
}

const READING_DATA: ReadingItem[] = [
  {
    id: "lotm",
    title: "Lord of the Mysteries",
    author: "Cuttlefish That Loves Diving",
    type: "NOVEL",
    category: "Steampunk Fantasy, Cosmic Horror, Mystery Thriller",
    rank: 1,
    isTopThree: true,
    progress: "Ongoing / Volume 7",
    status: "Reading",
    cover: "/images/reading/lotm.webp",
    rating: "10 / 10",
    quote: "Light was the meaning to everything",
    quoteContext: "",
    personalThoughts: "",
    tags: ["Beyonder Pathways", "Cosmic Horror", "Victorian Gothic", "Tarot Club"],
    accentColor: "from-mauve/20 to-purple-900/40 border-mauve/30 text-mauve"
  },
  {
    id: "cultivation",
    title: "A Regressor's Tale of Cultivation",
    author: "chungnanum",
    type: "NOVEL",
    category: "Xianxia / Regression / Psychological",
    rank: 2,
    isTopThree: true,
    progress: "Ongoing / 15th cycle",
    status: "Reading",
    cover: "/images/reading/cultivation.webp",
    rating: "9.8 / 10",
    quote: "What is life to someone who lived without a heart, so desperately clinging to it?",
    quoteContext: "",
    personalThoughts: "",
    tags: ["Time Loop", "Emotional Weight", "Cultivation", "Perseverance"],
    accentColor: "from-sapphire/20 to-blue-900/40 border-sapphire/30 text-sapphire"
  },
  {
    id: "ghost-story",
    title: "Got Dropped into a Ghost Story, Still Gotta Work",
    author: "Baek Deok-su",
    type: "NOVEL",
    category: "Urban Horror / Mystery Thriller",
    rank: 3,
    isTopThree: true,
    progress: "Ongoing / Part 1",
    status: "Reading",
    cover: "/images/reading/ghost_story.webp",
    rating: "9.5 / 10",
    personalThoughts: "",
    tags: ["Urban Legends", "Horror Thriller", "Supernatural", "Mystery"],
    accentColor: "from-green/20 to-emerald-900/40 border-green/30 text-green"
  },
  {
    id: "mount-hua",
    title: "Return of the Mount Hua Sect",
    author: "Biga",
    type: "MANHWA",
    category: "Murim / Martial Arts",
    rank: 1,
    isTopThree: false,
    progress: "Ongoing / Season 3",
    status: "Caught Up",
    cover: "/images/reading/Return-of-Mount-Hua-Sect.jpeg",
    rating: "9.7 / 10",
    personalThoughts: "",
    tags: ["Plum Blossom", "Murim", "Reincarnation"],
    accentColor: "from-pink/20 to-rose-900/40 border-pink/30 text-pink"
  },
  {
    id: "black-haze",
    title: "Black Haze",
    author: "Yong Yong",
    type: "MANHWA",
    category: "Urban Fantasy / Magic Academy / Comedy",
    rank: 2,
    isTopThree: false,
    progress: "Completed (Axed)",
    status: "Completed",
    cover: "/images/reading/blackhaze.jpg",
    rating: "9.4 / 10",
    personalThoughts: "",
    tags: ["Magic Academy", "Dual Identity", "Iconic Art"],
    accentColor: "from-lavender/20 to-indigo-900/40 border-lavender/30 text-lavender"
  }
];

export default function ReadingPage() {
  const [filter, setFilter] = useState<"ALL" | "NOVEL" | "MANHWA">("ALL");

  const topThreeNovels = READING_DATA.filter((item) => item.isTopThree);
  const honorableMentions = READING_DATA.filter((item) => !item.isTopThree);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center text-xs font-semibold text-subtext0 hover:text-mauve transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
        Back to Overview
      </Link>

      {/* Header Section aligned with /music & /gallery */}
      <div className="mb-12 border-b border-surface0/60 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-mauve mb-4 flex items-center justify-center md:justify-start">
            <BookOpen className="w-8 h-8 mr-3" /> Reading Log
          </h1>
          <p className="text-subtext0 text-lg max-w-2xl">
            A curated showcase of web novels and manhwas that I enjoy reading.
          </p>

          {/* Obsidian Admonition Callout */}
          <div className="mt-6 p-4 rounded-xl bg-crust/70 border border-surface0/80 border-l-4 border-l-mauve shadow-lg backdrop-blur-md flex items-start gap-3 max-w-xl text-left">
            <AlertTriangle className="w-4 h-4 text-mauve shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-mauve block mb-0.5">
                Note / Disclaimer
              </span>
              <p className="text-xs text-subtext0 leading-relaxed font-medium">
                Personal reading log of web novels and manhwas I enjoy in my free time. Ratings and selections are purely personal!
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1.5 bg-crust p-1.5 rounded-xl border border-surface0/80 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "ALL"
                ? "bg-mauve text-crust shadow-md"
                : "text-subtext0 hover:text-text hover:bg-surface0/50"
            }`}
          >
            All Picks
          </button>
          <button
            onClick={() => setFilter("NOVEL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "NOVEL"
                ? "bg-mauve text-crust shadow-md"
                : "text-subtext0 hover:text-text hover:bg-surface0/50"
            }`}
          >
            Web Novels
          </button>
          <button
            onClick={() => setFilter("MANHWA")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "MANHWA"
                ? "bg-mauve text-crust shadow-md"
                : "text-subtext0 hover:text-text hover:bg-surface0/50"
            }`}
          >
            Manhwas
          </button>
        </div>
      </div>

      {/* Section 1: The Top Fixations (Top 3 Novels) */}
      {filter !== "MANHWA" && (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2.5">
              <Flame className="w-5 h-5 text-peach" />
              <h2 className="text-2xl font-bold text-text">Current Reading</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topThreeNovels.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`group relative flex flex-col bg-crust/60 border rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${item.accentColor}`}
              >
                {/* Hover Hint Badge */}
                {item.personalThoughts && (
                  <div className="absolute top-3 right-3 z-10 bg-crust/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-surface0/60 text-[9px] font-medium text-subtext0 group-hover:opacity-0 transition-opacity flex items-center gap-1">
                    <MessageSquareText className="w-3 h-3 text-mauve" />
                    <span>Hover Thoughts</span>
                  </div>
                )}

                {/* Scaled Aspect-Ratio Book Cover Container with Ambient Glow */}
                {item.cover ? (
                  <div className="relative w-full py-5 bg-crust/80 flex items-center justify-center border-b border-surface0/60 shrink-0 overflow-hidden">
                    {/* Ambient Glow Background Layer */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative aspect-[2/3] w-48 max-w-[80%] filter blur-2xl opacity-50 group-hover:opacity-85 group-hover:scale-110 transition-all duration-500">
                        <Image
                          src={item.cover}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      </div>
                    </div>

                    {/* Crisp Book Cover Layer */}
                    <div className="relative aspect-[2/3] w-48 max-w-[80%] rounded-xl overflow-hidden shadow-2xl border border-surface1/40 group-hover:border-mauve/50 transition-colors z-10">
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="200px"
                      />
                    </div>

                    {item.personalThoughts && (
                      <div className="absolute inset-0 bg-crust/95 backdrop-blur-md p-5 flex flex-col justify-center transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20 border-b border-surface0">
                        <div className="flex items-center gap-1.5 text-mauve mb-2">
                          <MessageSquareText className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Personal Thoughts</span>
                        </div>
                        <p className="text-xs text-text leading-relaxed font-medium overflow-y-auto max-h-44 pr-1">
                          &quot;{item.personalThoughts}&quot;
                        </p>
                        <div className="mt-3 pt-2 border-t border-surface0/60 flex items-center justify-between text-[10px] text-subtext0">
                          <span>Rating: <strong className="text-yellow">{item.rating}</strong></span>
                          <span className="capitalize">{item.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-32 bg-gradient-to-br from-surface0/60 to-surface1/30 p-5 flex flex-col justify-end shrink-0 border-b border-surface0/60">
                    <BookOpen className="w-6 h-6 text-mauve/40 mb-1" />
                    <span className="text-[10px] font-bold text-subtext0 uppercase tracking-widest">{item.type}</span>
                  </div>
                )}

                {/* Content Info */}
                <div className="p-5 flex flex-col flex-grow justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-subtext0 mb-1">
                      <span>{item.category}</span>
                      <span className="text-yellow font-bold">★ {item.rating}</span>
                    </div>

                    <h3 className="text-lg font-bold text-text leading-snug group-hover:text-rosewater transition-colors">
                      {item.title}
                    </h3>
                    {item.author && (
                      <p className="text-xs text-subtext0 mb-3">by {item.author}</p>
                    )}

                    {/* Progress Badge */}
                    <div className="mb-4 inline-flex items-center gap-1.5 bg-surface0/80 px-2.5 py-1 rounded-md border border-surface1/60 text-xs font-semibold text-mauve">
                      <Bookmark className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.progress}</span>
                    </div>

                    {/* Personal Thoughts Inline Snapshot */}
                    {item.personalThoughts && (
                      <div className="mb-4 text-xs text-subtext1 leading-relaxed bg-surface0/30 p-2.5 rounded-lg border border-surface0/50">
                        <span className="text-[10px] font-bold uppercase text-mauve block mb-0.5">Personal Thoughts:</span>
                        {item.personalThoughts}
                      </div>
                    )}
                  </div>

                  {/* Quote Box */}
                  {item.quote && (
                    <div className="mt-auto bg-mantle/80 p-3.5 rounded-xl border border-surface0/80 relative">
                      <Quote className="w-4 h-4 text-mauve/40 absolute top-2 right-2" />
                      <p className="text-[11px] italic text-rosewater/90 font-serif leading-snug pr-4">
                        &quot;{item.quote}&quot;
                      </p>
                      {item.quoteContext && (
                        <p className="text-[9px] font-sans text-subtext0/80 mt-1.5 uppercase tracking-wider font-semibold">
                          — {item.quoteContext}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-surface0/40">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-surface0/40 text-subtext0"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Honorable Mentions (Manhwa Top Picks) */}
      {filter !== "NOVEL" && (
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-mauve" />
              <h2 className="text-2xl font-bold text-text">Honorable Mentions</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {honorableMentions.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`group relative flex flex-col bg-crust/60 border rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${item.accentColor}`}
              >
                {/* Hover Hint Badge */}
                {item.personalThoughts && (
                  <div className="absolute top-3 right-3 z-10 bg-crust/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-surface0/60 text-[9px] font-medium text-subtext0 group-hover:opacity-0 transition-opacity flex items-center gap-1">
                    <MessageSquareText className="w-3 h-3 text-pink" />
                    <span>Hover Thoughts</span>
                  </div>
                )}

                {/* Scaled Aspect-Ratio Book Cover Container with Ambient Glow */}
                {item.cover ? (
                  <div className="relative w-full py-5 bg-crust/80 flex items-center justify-center border-b border-surface0/60 shrink-0 overflow-hidden">
                    {/* Ambient Glow Background Layer */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative aspect-[2/3] w-48 max-w-[80%] filter blur-2xl opacity-50 group-hover:opacity-85 group-hover:scale-110 transition-all duration-500">
                        <Image
                          src={item.cover}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      </div>
                    </div>

                    {/* Crisp Book Cover Layer */}
                    <div className="relative aspect-[2/3] w-48 max-w-[80%] rounded-xl overflow-hidden shadow-2xl border border-surface1/40 group-hover:border-pink/50 transition-colors z-10">
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="200px"
                      />
                    </div>

                    {item.personalThoughts && (
                      <div className="absolute inset-0 bg-crust/95 backdrop-blur-md p-5 flex flex-col justify-center transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20 border-b border-surface0">
                        <div className="flex items-center gap-1.5 text-pink mb-2">
                          <MessageSquareText className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Personal Thoughts</span>
                        </div>
                        <p className="text-xs text-text leading-relaxed font-medium overflow-y-auto max-h-40 pr-1">
                          &quot;{item.personalThoughts}&quot;
                        </p>
                        <div className="mt-3 pt-2 border-t border-surface0/60 flex items-center justify-between text-[10px] text-subtext0">
                          <span>Rating: <strong className="text-yellow">{item.rating}</strong></span>
                          <span className="capitalize">{item.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-32 bg-gradient-to-br from-surface0/60 to-surface1/30 p-5 flex flex-col justify-end shrink-0 border-b border-surface0/60">
                    <BookOpen className="w-6 h-6 text-pink/40 mb-1" />
                    <span className="text-[10px] font-bold text-subtext0 uppercase tracking-widest">{item.type}</span>
                  </div>
                )}

                {/* Content Info */}
                <div className="p-5 flex flex-col flex-grow justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-subtext0 mb-1">
                      <span>{item.category}</span>
                      <span className="text-yellow font-bold">★ {item.rating}</span>
                    </div>

                    <h3 className="text-lg font-bold text-text leading-snug group-hover:text-pink transition-colors">
                      {item.title}
                    </h3>
                    {item.author && (
                      <p className="text-xs text-subtext0 mb-3">by {item.author}</p>
                    )}

                    {/* Progress Badge */}
                    <div className="mb-4 inline-flex items-center gap-1.5 bg-surface0/80 px-2.5 py-1 rounded-md border border-surface1/60 text-xs font-semibold text-pink">
                      <Bookmark className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.progress}</span>
                    </div>

                    {/* Personal Thoughts Inline Snapshot */}
                    {item.personalThoughts && (
                      <div className="mb-4 text-xs text-subtext1 leading-relaxed bg-surface0/30 p-2.5 rounded-lg border border-surface0/50">
                        <span className="text-[10px] font-bold uppercase text-pink block mb-0.5">Personal Thoughts:</span>
                        {item.personalThoughts}
                      </div>
                    )}
                  </div>

                  {/* Quote Box */}
                  {item.quote && (
                    <div className="mt-auto bg-mantle/80 p-3.5 rounded-xl border border-surface0/80 relative">
                      <Quote className="w-4 h-4 text-pink/40 absolute top-2 right-2" />
                      <p className="text-[11px] italic text-rosewater/90 font-serif leading-snug pr-4">
                        &quot;{item.quote}&quot;
                      </p>
                      {item.quoteContext && (
                        <p className="text-[9px] font-sans text-subtext0/80 mt-1.5 uppercase tracking-wider font-semibold">
                          — {item.quoteContext}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-surface0/40">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-surface0/40 text-subtext0"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
