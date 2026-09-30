"use client";

import { motion } from "framer-motion";
import { GitPullRequest, ExternalLink } from "lucide-react";
import Link from "next/link";

export interface ContributionItem {
  id: string;
  repo: string;
  description: string;
  bulletPoints?: string[];
  link: string;
}

const contributions: ContributionItem[] = [
  {
    id: "nthu-mods",
    repo: "NTHU Mods",
    description:
      "Contributed to the university's open-source platform by developing and shipping a real-time library seat vacancy tracker utilizing public APIs, alongside a laundry availability feature.",
    bulletPoints: [
      "Developed and shipped a real-time library seat vacancy tracker utilizing public APIs.",
      "Built a laundry availability tracking feature for dormitory washing machines and dryers.",
    ],
    link: "https://github.com/nthumodifications/courseweb",
  },
  {
    id: "scaligator",
    repo: "p-r-a-v-i-n/scaligator",
    description:
      "Submitted pull requests to an intelligent Kubernetes Horizontal Pod Autoscaler alternative.",
    bulletPoints: [
      "Implemented file & CLI configuration loading with --config flag parsing.",
      "Created Prometheus /metrics endpoint tracking scale-up/down events and HTTP request counters.",
      "Built automated CI/CD pipeline in GitHub Actions with multi-stage Docker builds published to GHCR.",
      "Engineered time-based controller reconciliation loop in controller.rs.",
    ],
    link: "https://github.com/p-r-a-v-i-n/scaligator/pulls?q=is%3Apr+author%3AFabioCanavarro",
  },
  {
    id: "infraust",
    repo: "infraust/infraust",
    description:
      "Submitted a pull request to a high-efficiency Minecraft server host.",
    bulletPoints: [
      "Implemented multi-platform Docker matrix builds targeting linux/arm/v7, linux/arm64, and linux/amd64.",
    ],
    link: "https://github.com/Shadowner/Infrarust/pulls?q=is%3Apr+author%3AFabioCanavarro",
  },
  {
    id: "rwatch",
    repo: "p-r-a-v-i-n/rwatch",
    description:
      "Submitted pull requests to an eBPF-based threat detection tool.",
    bulletPoints: [
      "Added structured severity levels and color-coded alert logging for threat detection rules.",
    ],
    link: "https://github.com/p-r-a-v-i-n/rwatch/pulls?q=is%3Apr+author%3AFabioCanavarro",
  },
  {
    id: "bifrost",
    repo: "bifrost/bifrost",
    description:
      "Contributed to an open-source smart lighting system alternative.",
    bulletPoints: [
      "Added Docker pull installation methods and local config guidance to README documentation.",
    ],
    link: "https://github.com/chrivers/bifrost/pulls?q=is%3Apr+author%3AFabioCanavarro",
  },
];

export default function OpenSource() {
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.section
      className="mb-24 relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.7 }}
    >
      <div id="opensource" className="absolute -top-24"></div>
      <h2 className="text-3xl font-bold mb-6 text-green flex items-center">
        <GitPullRequest className="w-6 h-6 mr-3 text-green" />
        Open Source Contributions
      </h2>

      <div className="space-y-4">
        {contributions.map((contrib) => (
          <motion.div
            key={contrib.id}
            variants={itemVariants}
            className="bg-crust/50 p-5 rounded-xl border border-surface0 backdrop-blur-sm transition-all duration-300 shadow-lg shadow-crust/50 hover:border-green/50 hover:shadow-xl hover:shadow-green/10"
          >
            <Link
              href={contrib.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-text group-hover:text-green transition-colors text-lg">
                  {contrib.repo}
                </h3>
                <ExternalLink className="w-4 h-4 text-subtext1 group-hover:text-green transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </Link>

            {contrib.bulletPoints ? (
              <ul className="list-disc list-inside space-y-1 text-sm text-subtext0 mt-1">
                {contrib.bulletPoints.map((point, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {point}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-subtext0 text-sm mt-1">{contrib.description}</p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
