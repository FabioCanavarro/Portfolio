import Link from "next/link";
import { getSortedPostsData } from "@/lib/posts";
import { BookText, ArrowLeft, AlertCircle } from "lucide-react";

const tagColorMap: { [key: string]: string } = {
  rust: "bg-peach/20 text-peach border-peach/30",
  systems: "bg-blue/20 text-blue border-blue/30",
  kernel: "bg-mauve/20 text-mauve border-mauve/30",
  webdev: "bg-green/20 text-green border-green/30",
  os: "bg-red/20 text-red border-red/30",
  default: "bg-surface2/20 text-subtext1 border-surface2/30",
};

const getTagColor = (tag: string) => {
  return tagColorMap[tag.toLowerCase()] || tagColorMap.default;
};

export default function Blog() {
  const allPostsData = getSortedPostsData();

  return (
    <section>
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center text-xs font-semibold text-subtext0 hover:text-mauve transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
        Back to Overview
      </Link>

      {/* Header Section aligned with /music, /reading & /gallery */}
      <div className="mb-12 border-b border-surface0/60 pb-8">
        <h1 className="text-4xl font-bold text-mauve mb-4 flex items-center">
          <BookText className="w-8 h-8 mr-3" /> Blog & Writings
        </h1>
        <p className="text-subtext0 text-lg max-w-2xl">
          A collection of technical writeups, project logs, and personal thoughts on software engineering.
        </p>

        {/* Obsidian Admonition Callout */}
        <div className="mt-6 p-4 rounded-xl bg-crust/70 border border-surface0/80 border-l-4 border-l-mauve shadow-lg backdrop-blur-md flex items-start gap-3 max-w-xl text-left">
          <AlertCircle className="w-4 h-4 text-mauve shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-mauve block mb-0.5">
              Notice / Blog Feed
            </span>
            <p className="text-xs text-subtext0 leading-relaxed font-medium">
              Technical writeups and project deep-dives. Thoughts expressed here are personal.
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-8">
        {allPostsData.map(({ slug, title, date, description, tags }) => (
          <li key={slug}>
            <Link href={`/blog/${slug}`} className="group block">
              <div className="bg-crust/50 p-6 rounded-xl border border-surface0 backdrop-blur-sm transition-all duration-300 shadow-lg shadow-crust/50 group-hover:border-mauve/50 group-hover:shadow-xl group-hover:shadow-mauve/10">
                <p className="text-subtext1 mb-2">{date}</p>
                <h2 className="text-2xl font-semibold text-text group-hover:text-mauve transition-colors">
                  {title}
                </h2>
                <p className="text-subtext0 mt-3 leading-relaxed">
                  {description}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs px-2.5 py-1 rounded-full border ${getTagColor(
                        tag
                      )}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}