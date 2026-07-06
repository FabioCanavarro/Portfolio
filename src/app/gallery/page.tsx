import { supabase } from "@/lib/supabase";
import GalleryClient from "./_components/GalleryClient";

export const metadata = {
  title: "Gallery | Fabio Canavarro",
  description: "A showcase of my photography over the years.",
};

export const revalidate = 60; // Revalidate the page every 60 seconds

export default async function GalleryPage() {
  // Fetch from Supabase
  const { data: photographyData, error } = await supabase
    .from("photos")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching photos:", error);
  }

  const photos = photographyData || [];

  // Group photos by year
  const photosByYear = photos.reduce((acc, photo) => {
    if (!acc[photo.year]) {
      acc[photo.year] = [];
    }
    acc[photo.year].push(photo);
    return acc;
  }, {} as Record<string, typeof photos>);

  const sortedYears = Object.keys(photosByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-mauve mb-4">Photography</h1>
        <p className="text-subtext0 max-w-2xl text-lg">
          A collection of moments captured over the years.
        </p>
      </div>

      {photos.length === 0 && (
        <div className="note-block mt-8 text-subtext0 bg-crust/50 border border-surface0 p-6 rounded-xl text-center">
          <p className="text-red font-medium">Error: No photos added yet, coming soon :)</p>
        </div>
      )}

      {photos.length > 0 && (
        <GalleryClient photosByYear={photosByYear} sortedYears={sortedYears} />
      )}
    </div>
  );
}
