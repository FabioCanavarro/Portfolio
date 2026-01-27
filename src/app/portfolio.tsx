"use client";

import { useState, useEffect } from "react";
import MainBody from "./_components/main-body";
import Footer from "./_components/footer";
import GridBackground from "./_components/grid-background";
import { Analytics } from "@vercel/analytics/next"

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Fabio Canavarro",
  url: "https://fabiocanavarro.vercel.app/",
  sameAs: ["https://github.com/FabioCanavarro"],
  jobTitle: "Software Developer",
  worksFor: {
    "@type": "Organization",
    name: "Arts&Legend.id",
  },
  description:
    "A 16-year-old software developer specializing in Rust, systems programming, and building foundational technologies.",
  alumniOf: "Hackclub",
};



import { PostData } from "@/lib/posts";

interface PortfolioProps {
  posts: PostData[];
}

export default function Portfolio({ posts }: PortfolioProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const colors = {
    base: "#24273a",
    crust: "#1e2030",
    surface0: "#363a4f",
    surface2: "#575b71",
    text: "#cad3f5",
    subtext0: "#a5adce",
    subtext1: "#939ab7",
    mauve: "#cba6f7",
    rosewater: "#f5e0dc",
    flamingo: "#f2cdcd",
    blue: "#89b4fa",
    green: "#a6e3a1",
    sapphire: "#74c7ec",
    red: "#f38ba8",
  };

  return (
    <div
      className="min-h-screen text-text font-sans antialiased"
      style={{ backgroundColor: colors.base }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GridBackground />
      <MainBody posts={posts} />
      <Footer />
      <Analytics />
    </div>
  );
}
