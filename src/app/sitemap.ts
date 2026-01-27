import { MetadataRoute } from "next";
import { getSortedPostsData } from "@/lib/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://fabiocanavarro.vercel.app";
  const posts = getSortedPostsData();

  const postsUrls = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...postsUrls,
  ];
}
