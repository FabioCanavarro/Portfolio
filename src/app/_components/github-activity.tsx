"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GitCommit, Github, Activity } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import blacklist from "@/data/repo-blacklist.json";

interface GithubEvent {
  type: string;
  repo: {
    name: string;
  };
  created_at: string;
}

export default function GithubActivity() {
  const [lastCommit, setLastCommit] = useState<{
    repo: string;
    timeAgo: string;
  } | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/users/FabioCanavarro/events"
        );
        const events: GithubEvent[] = await response.json();

        // Filter for PushEvents and check blacklist
        const pushEvent = events.find(
          (event) =>
            event.type === "PushEvent" &&
            !blacklist.some((blocked) => event.repo.name.includes(blocked))
        );

        if (pushEvent) {
          const timeAgo = getTimeAgo(new Date(pushEvent.created_at));
          setLastCommit({
            repo: pushEvent.repo.name,
            timeAgo,
          });
        }
      } catch (error) {
        console.error("Error fetching GitHub events:", error);
      }
    };

    fetchEvents();
  }, []);

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Handle future dates or timezone skew
    if (seconds < 0) return "Just now";
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  };

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
      <div id="activity" className="absolute -top-24"></div>
      <h2 className="text-3xl font-bold mb-8 text-mauve flex items-center">
        <Activity className="w-6 h-6 mr-3" />
        Coding Activity
      </h2>

      <div className="grid grid-cols-1 gap-8">
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Last Commit Status */}
          <div className="bg-crust/50 p-6 rounded-xl border border-surface0 backdrop-blur-sm shadow-lg shadow-crust/50 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-mauve/10 rounded-full">
                <GitCommit className="w-6 h-6 text-mauve" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Latest Commit</h3>
                {lastCommit ? (
                  <p className="text-subtext0">
                    <span className="text-green font-medium">
                      {lastCommit.timeAgo}
                    </span>{" "}
                    in{" "}
                    <Link
                      href={`https://github.com/${lastCommit.repo}`}
                      target="_blank"
                      className="text-blue hover:underline"
                    >
                      {lastCommit.repo}
                    </Link>
                  </p>
                ) : (
                  <p className="text-subtext0">Fetching status...</p>
                )}
              </div>
            </div>
            <Link
              href="https://github.com/FabioCanavarro"
              target="_blank"
              className="hidden sm:flex items-center text-subtext1 hover:text-text transition-colors"
            >
              <Github className="w-5 h-5 mr-2" />
              View Profile
            </Link>
          </div>

          {/* Contribution Calendar & Stats */}
          <div className="flex flex-col gap-6">
             {/* Stats Card */}
            <div className="w-full bg-crust/50 p-4 rounded-xl border border-surface0 backdrop-blur-sm shadow-lg shadow-crust/50 flex items-center justify-center">
               <Image
                src={`https://github-readme-stats.vercel.app/api?username=FabioCanavarro&show_icons=true&hide_border=true&count_private=true&theme=catppuccin_mocha&hide_rank=false&include_all_commits=true&hide_title=true`}
                alt="GitHub Stats"
                width={1000}
                height={400}
                unoptimized
                className="w-full max-w-4xl h-auto"
              />
            </div>

            {/* Contribution Graph - Dark Mode Optimized with Catppuccin Mauve */}
            <div className="w-full bg-crust/50 p-6 rounded-xl border border-surface0 backdrop-blur-sm shadow-lg shadow-crust/50 overflow-hidden flex items-center justify-center">
               {/* 
                  Color Math for Dark Mode:
                  Target Color: Catppuccin Mauve (#cba6f7)
                  Background Transform: White -> Black (via invert(1))
                  
                  To get Mauve after inversion, we need to supply its inverse color to the API.
                  Mauve #cba6f7 = RGB(203, 166, 247)
                  Inverse = RGB(255-203, 255-166, 255-247) = RGB(52, 89, 8) = #345908
                  
                  So we request color #345908. 
                  When styled with 'filter: invert(1) hue-rotate(180deg)'... wait. 
                  Simple invert(1) flips color. 
                  hue-rotate(180deg) rotates it around color wheel.
                  
                  Let's stick to simple invert for exact color matching.
                  If we use invert(1) only:
                  White bg -> Black bg.
                  #345908 (Dark Green) -> #cba6f7 (Mauve).
                  Text (Grey) -> Light Grey.
               */}
               <div className="w-full overflow-x-auto">
                 <Image 
                   src="https://ghchart.rshah.org/345908/FabioCanavarro" 
                   alt="Contribution Graph"
                   width={1000}
                   height={300}
                   unoptimized
                   className="w-full min-w-[800px]"
                   style={{ 
                     filter: "invert(1)",
                     borderRadius: "0.5rem"
                   }}
                 />
                 <p className="text-center text-subtext1 text-sm mt-2">
                   (Inverted for Dark Mode)
                 </p>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
