import { supabase } from "@/lib/supabase";
import GalleryClient from "./_components/GalleryClient";
import { AlertTriangle, ArrowLeft, Camera } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Gallery | Fabio Canavarro",
  description: "A showcase of my photography over the years.",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  // Fetch from Supabase (only published photos)
  const { data: photographyData, error } = await supabase
    .from("photos")
    .select("*")
    .eq("published", true)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching photos:", error);
  }

  const photos = (photographyData || []).map((photo) => {
    const raw = photo as unknown as Record<string, unknown>;
    
    let parsedCategory = (raw.category as string) || "Scenery";
    let parsedPrimaryType = (raw.primary_type as string) || "edited";
    
    const dbTags = Array.isArray(raw.tags) ? (raw.tags as string[]) : [];
    const filteredTags = dbTags.filter(t => {
      if (t.startsWith("cat:")) {
        parsedCategory = t.substring(4);
        return false;
      }
      if (t.startsWith("type:")) {
        parsedPrimaryType = t.substring(5);
        return false;
      }
      return true;
    });

    return {
      ...photo,
      original: (raw.original as string) || (raw.original_url as string) || "",
      edited: (raw.edited as string) || (raw.edited_url as string) || "",
      variations: Array.isArray(raw.variations) ? raw.variations : [],
      category: parsedCategory,
      primary_type: parsedPrimaryType,
      tags: filteredTags,
    };
  }) as unknown as Parameters<typeof GalleryClient>[0]["photos"];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center text-xs font-semibold text-subtext0 hover:text-mauve transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
        Back to Overview
      </Link>

      <div className="mb-12 border-b border-surface0/60 pb-8">
        <h1 className="text-4xl font-bold text-mauve mb-4 flex items-center">
          <Camera className="w-8 h-8 mr-3" /> Photography
        </h1>
        <p className="text-subtext0 max-w-2xl text-lg">
          A collection of moments captured over the years.
        </p>

        {/* Obsidian Admonition Callout */}
        <div className="mt-6 p-4 rounded-xl bg-crust/70 border border-surface0/80 border-l-4 border-l-yellow shadow-lg backdrop-blur-md flex items-start gap-3 max-w-2xl">
          <AlertTriangle className="w-4 h-4 text-yellow shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-yellow block mb-0.5">
              Warning / Note
            </span>
            <p className="text-xs text-subtext0 leading-relaxed font-medium">
              Slight warning, I am terrible at photography and editing, this is just for fun
            </p>
          </div>
        </div>
      </div>

      {photos.length === 0 && (
        <div className="note-block mt-8 text-subtext0 bg-crust/50 border border-surface0 p-6 rounded-xl text-center">
          <p className="text-red font-medium">Error: No photos added yet, coming soon :)</p>
        </div>
      )}

      {photos.length > 0 && (
        <GalleryClient photos={photos} />
      )}
    </div>
  );
}
