import { easeOut, motion } from "framer-motion";
import {
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  Cpu,
  Server,
  Bot,
  Code,
  Gamepad2,
  GitPullRequest,
  Building,
  Sparkles,
  Database,
} from "lucide-react";
import AnimatedText from "./animated-text";
import Link from "next/link";
import AboutMe from "./about-me";


const projects = [
  {
    title: "EpochDB",
    description: "An intelligent, persistent key-value store built in Rust. Features a multi-tree architecture, atomic TTLs, and a concurrent background thread for data lifecycle management. Published to crates.io",
    tags: ["Rust", "Systems Programming", "Database", "Concurrency", "sled", "Embedded Database"],
    icon: <Database className="w-6 h-6 text-peach" />,
    link: "https://github.com/FabioCanavarro/EpochDB"
  },
  {
    title: "UnitOS",
    description:
      "An operating system kernel built from scratch that runs on x86_64 systems, exploring the fundamentals of system architecture.",
    tags: ["Rust", "x86_64", "OS Kernel", "Assembly"],
    icon: <Cpu className="w-6 h-6 text-mauve" />,
    link: "https://github.com/FabioCanavarro/UnitOS",
  },
  {
    title: "FerrisLog",
    description:
      "A persistent, log-structured key-value store in Rust, and a multi-threaded server-client implementation with a custom network protocol.",
    tags: ["Rust", "Distributed Systems", "Networking", "KVS"],
    icon: <Server className="w-6 h-6 text-blue" />,
    link: "https://github.com/FabioCanavarro/FerrisLog-ServerClient",
  },
  {
    title: "Agrobiosync",
    description:
      "An IoT-based automated farming system with a web dashboard to monitor and control cultivation, powered by an ESP8266.",
    tags: ["C++", "IoT", "ESP8266", "React", "Web Dev"],
    icon: <Sparkles className="w-6 h-6 text-green" />,
    link: "https://github.com/FabioCanavarro/Agrobiosync",
  },
  {
    title: "ChronoDomain",
    description:
      "A Minecraft mod that introduces time manipulation mechanics for blocks, entities, and entire chunks.",
    tags: ["Java", "Game Modding", "Minecraft"],
    icon: <Gamepad2 className="w-6 h-6 text-flamingo" />,
    link: "https://github.com/FabioCanavarro/Chrono-Domain",
  },
  {
    title: "Iridation",
    description:
      "A custom assembly language created in Rust, designed as a foundational layer for a future programming language.",
    tags: ["Rust", "Compilers", "Assembly"],
    icon: <Code className="w-6 h-6 text-sapphire" />,
    link: "https://github.com/FabioCanavarro/Irridation",
  },
  {
    title: "AI & Computer Vision Projects",
    description:
      "A collection of projects including face detection (Yunet) and an automated laser sentry, exploring AI and robotics.",
    tags: ["Python", "C++", "C#", "OpenCV", "AI/ML"],
    icon: <Bot className="w-6 h-6 text-red" />,
    link: "https://github.com/FabioCanavarro/",
  },
];

const contributions = [
  {
    repo: "p-r-a-v-i-n/scaligator",
    description:
      "Submitted a pull request to an intelligent Kubernetes Horizontal Pod Autoscaler alternative",
    link: "https://github.com/p-r-a-v-i-n/scaligator/pulls?q=is%3Apr+author%3AFabioCanavarro",
  },
  {
    repo: "bifrost/bifrost",
    description:
      "Contributed to an open-source smart lighting system alternative.",
    link: "https://github.com/chrivers/bifrost/pulls?q=is%3Apr+author%3AFabioCanavarro",
  },
  {
    repo: "p-r-a-v-i-n/rwatch",
    description:
      "Submitted a pull request to an eBPF-based threat detection tool",
    link: "https://github.com/p-r-a-v-i-n/rwatch/pulls?q=is%3Apr+author%3AFabioCanavarro",
  },
  {
    repo: "infraust/infraust",
    description:
      "Submitted a pull request to a high-efficiency Minecraft server host.",
    link: "https://github.com/Shadowner/Infrarust/pulls?q=is%3Apr+author%3AFabioCanavarro",
  },
];


import LatestPosts from "./latest-posts";
import Contact from "./contact";
import { PostData } from "@/lib/posts";

interface MainBodyProps {
  posts: PostData[];
}

const MainBody = ({ posts }: MainBodyProps) => {
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
        ease: easeOut,
      },
    },
  };

  return (
    <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 md:pt-32 md:pb-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero Section */}
        <section className="text-center mb-20">
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-4 text-mauve"
            variants={itemVariants}
          >
            Fabio Canavarro
          </motion.h1>
          <AnimatedText
            text="A 16-year-old developer and researcher crafting innovative solutions with code."
            el="h2"
            className="text-lg md:text-xl text-subtext0 mb-8"
          />
          <motion.div
            className="flex justify-center space-x-6"
            variants={itemVariants}
          >
            <Link
              href="https://github.com/FabioCanavarro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-subtext1 hover:text-mauve transition-colors duration-300"
            >
              <Github size={28} />
            </Link>
            <Link
              href="https://www.linkedin.com/in/fabio-canavarro-584b232a7/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-subtext1 hover:text-blue transition-colors duration-300"
            >
              <Linkedin size={28} />
            </Link>
            <Link
              href="mailto:fabiocanavarrotoh@gmail.com"
              className="text-subtext1 hover:text-rosewater transition-colors duration-300"
            >
              <Mail size={28} />
            </Link>
          </motion.div>
        </section>

      <AboutMe /> 

        {/* Experience Section */}
        <motion.section
          className="mb-24 relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7 }}
        >
          <div id="experience" className="absolute -top-24"></div>
          <h2 className="text-3xl font-bold mb-6 text-flamingo flex items-center">
            <Building className="w-6 h-6 mr-3" />
            Experience
          </h2>
          <div className="bg-crust/50 p-6 rounded-xl border border-surface0 backdrop-blur-sm transition-all duration-300 shadow-lg shadow-crust/50 hover:border-flamingo/50 hover:shadow-xl hover:shadow-flamingo/10">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-text">
                Head of Web Development
              </h3>
              <span className="text-sm text-subtext1">Present</span>
            </div>
            <p className="text-md text-blue">Arts&Legend.id (Non-Profit)</p>
            {/* //! Once the website has been fully deployed without lorem ipsum than i can include this */}
            {/* 
                <Link 
                  href="https://artslegendsdeploy.vercel.app/"
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-medium text-rosewater hover:text-flamingo transition-colors duration-300 group mt-1"
                >
                  View Website
                  <ExternalLink className="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              */}
            <p className="mt-4 text-subtext0">
              Led the end-to-end development of the organization&apos;s official
              website. Architected and built a modern, responsive platform using
              Next.js, TypeScript, and Tailwind CSS to support our mission and
              showcase our work.
            </p>
          </div>
        </motion.section>



        {/* Projects Section */}
        <section className="mb-24 relative">
          <div id="projects" className="absolute -top-24"></div>
          <h2 className="text-3xl font-bold mb-8 text-mauve flex items-center">
            <Cpu className="w-6 h-6 mr-3" />
            Featured Projects
          </h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {projects.map((project, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-crust/50 rounded-xl border border-surface0 backdrop-blur-sm overflow-hidden transition-all duration-300 shadow-lg shadow-crust/50 hover:border-mauve/50 hover:shadow-xl hover:shadow-mauve/10 hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    {project.icon}
                    <h3 className="text-xl font-semibold ml-3 text-text">
                      {project.title}
                    </h3>
                  </div>
                  <p className="text-subtext0 mb-4 h-24">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs bg-crust text-mauve px-2 py-1 rounded-full border border-surface2"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-rosewater hover:text-flamingo transition-colors duration-300 group"
                  >
                    View on GitHub
                    <ExternalLink className="w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>



        {/* Open Source Contributions */}
        <motion.section
          className="mb-24 relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7 }}
        >
          <div id="opensource" className="absolute -top-24"></div>
          <h2 className="text-3xl font-bold mb-6 text-green flex items-center">
            <GitPullRequest className="w-6 h-6 mr-3" />
            Open Source Contributions
          </h2>
          <div className="space-y-4">
            {contributions.map((contrib, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-crust/50 p-4 rounded-xl border border-surface0 backdrop-blur-sm transition-all duration-300 shadow-lg shadow-crust/50 hover:border-green/50 hover:shadow-xl hover:shadow-green/10"
              >
                <Link
                  href={contrib.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-text group-hover:text-green transition-colors">
                      {contrib.repo}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-subtext1 group-hover:text-green transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                  <p className="text-subtext0 text-sm mt-1">
                    {contrib.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <LatestPosts posts={posts} />

        <Contact />
      </motion.div>
    </main>
  );
};

export default MainBody;
