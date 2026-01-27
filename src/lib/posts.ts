import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode from "rehype-pretty-code";

const postsDirectory = path.join(process.cwd(), "posts");

export type PostData = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
};

export function getSortedPostsData(): PostData[] {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, "");
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const matterResult = matter(fileContents);

    return {
      slug,
      ...(matterResult.data as {
        title: string;
        date: string;
        description: string;
        tags: string[];
      }),
    };
  });

  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export async function getPostData(slug: string) {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);

  // Calculate reading time
  const wordCount = matterResult.content.split(/\s+/g).length;
  const readingTime = Math.ceil(wordCount / 200);

  const processedContent = await unified()
    .use(remarkParse)
    // REMOVE the allowDangerousHtml option from this line
    .use(remarkRehype)
    .use(rehypePrettyCode, {
      theme: "catppuccin-macchiato",
    })
    .use(rehypeStringify)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  // Get next and previous posts
  const sortedPosts = getSortedPostsData();
  const currentPostIndex = sortedPosts.findIndex((post) => post.slug === slug);
  const previousPost = sortedPosts[currentPostIndex + 1] || null;
  const nextPost = sortedPosts[currentPostIndex - 1] || null;

  return {
    slug,
    contentHtml,
    readingTime,
    previousPost,
    nextPost,
    ...(matterResult.data as {
      title: string;
      date: string;
      description?: string;
    }),
  };
}

export function getAllPostSlugs() {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames.map((fileName) => {
    return {
      params: {
        slug: fileName.replace(/\.md$/, ""),
      },
    };
  });
}
