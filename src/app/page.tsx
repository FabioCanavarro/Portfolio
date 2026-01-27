import Portfolio from "./portfolio";
import { getSortedPostsData } from "@/lib/posts";

export const metadata = {
  title: "Fabio Canavarro | Systems Programmer & Developer",
  description:
    "The portfolio of Fabio Canavarro, a 16-year-old software developer specializing in Rust, systems programming, and open-source contributions.",
  keywords: [
    "Fabio Canavarro",
    "Rust Developer",
    "Systems Programming",
    "Portfolio",
    "OS Kernel",
  ],
};

export default function HomePage() {
  const posts = getSortedPostsData();
  return <Portfolio posts={posts} />;
}
