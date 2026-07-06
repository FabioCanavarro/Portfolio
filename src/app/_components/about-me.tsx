"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown } from "lucide-react";

export default function AboutMe() {
  const [goalsOpen, setGoalsOpen] = useState(false);

  return (
    <motion.section
      className="mb-24 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.7 }}
    >
      <div id="about" className="absolute -top-24"></div>
      <h2 className="text-3xl font-bold mb-6 text-rosewater flex items-center">
        <Sparkles className="w-6 h-6 mr-3" />
        About Me
      </h2>
      <div className="space-y-4 text-subtext0 leading-relaxed bg-crust/50 p-6 rounded-xl border border-surface0 backdrop-blur-sm shadow-lg shadow-crust/50">
        <p>
          As a 17-year-old software developer, I specialize in systems
          programming with a primary focus on Rust, complemented by a strong
          foundation in Python. While my passion lies with low-level
          development, I am also familiar with languages like C++, Java,
          TypeScript, HTML, and CSS from various projects. I&apos;m
          captivated by the intricate &quot;ins and outs&quot; of
          computing—the challenge and control that come with low-level
          development. The incredible leap in performance from early
          computers to today&apos;s systems inspires me to engineer software
          that is both powerful and efficient.
        </p>
        <div>
          <button
            onClick={() => setGoalsOpen(!goalsOpen)}
            className="flex items-center text-lg font-semibold text-mauve hover:text-flamingo transition-colors duration-300 w-full text-left"
          >
            My Current Goals
            <ChevronDown
              className={`w-5 h-5 ml-2 transform transition-transform duration-300 ${
                goalsOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence>
            {goalsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="mt-2"
              >
                <p>
                  Currently, I am diving deeper into asynchronous programming in
                  Rust, focusing on advanced benchmarking and optimization
                  techniques to push my code to its limits. My ambition extends to
                  building foundational technologies from the ground up, with
                  long-term goals that include developing a complete operating
                  system, creating a feature-rich database engine named EpochDB,
                  and evolving my assembly project into a full-fledged programming
                  language. I am driven by the pursuit of solving complex problems
                  and engineering the robust, high-performance systems of the
                  future.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}