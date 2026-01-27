import { motion } from "framer-motion";
import { BookText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PostData } from "@/lib/posts";

interface LatestPostsProps {
  posts: PostData[];
}

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

export default function LatestPosts({ posts }: LatestPostsProps) {
  if (!posts || posts.length === 0) return null;

  const latestPosts = posts.slice(0, 2);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.section
      className="mb-24 relative"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      <div id="latest-posts" className="absolute -top-24"></div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-mauve flex items-center">
          <BookText className="w-6 h-6 mr-3" />
          Latest Writings
        </h2>
        <Link 
          href="/blog" 
          className="group flex items-center text-sm font-medium text-subtext1 hover:text-mauve transition-colors duration-300"
        >
          View All
          <ArrowRight className="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {latestPosts.map((post) => (
          <motion.div
            key={post.slug}
            variants={itemVariants}
            className="flex flex-col bg-crust/50 p-6 rounded-xl border border-surface0 backdrop-blur-sm transition-all duration-300 shadow-lg shadow-crust/50 hover:border-mauve/50 hover:shadow-xl hover:shadow-mauve/10"
          >
            <div className="flex-1">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm text-subtext1">{post.date}</p>
              </div>
              
              <Link href={`/blog/${post.slug}`} className="group block">
                <h3 className="text-xl font-semibold text-text mb-3 group-hover:text-mauve transition-colors line-clamp-2">
                  {post.title}
                </h3>
              </Link>
              
              <p className="text-subtext0 text-sm leading-relaxed mb-4 line-clamp-3">
                {post.description}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-auto">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-1 rounded-md border ${getTagColor(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
