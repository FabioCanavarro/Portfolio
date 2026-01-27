import { motion } from "framer-motion";
import { Mail, MessageSquare, Send } from "lucide-react";
import Link from "next/link";

export default function Contact() {
  return (
    <motion.section
      className="mb-24 relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.7 }}
    >
      <div id="contact" className="absolute -top-24"></div>
      <h2 className="text-3xl font-bold mb-8 text-rosewater flex items-center">
        <MessageSquare className="w-6 h-6 mr-3" />
        Get In Touch
      </h2>

      <div className="bg-crust/50 get-in-touch-card p-8 rounded-xl border border-surface0 backdrop-blur-sm shadow-lg shadow-crust/50">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-lg text-text mb-6">
            I&apos;m always open to discussing new projects, creative ideas, or opportunities to be part of your visions.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="mailto:fabiocanavarrotoh@gmail.com"
              className="inline-flex items-center px-6 py-3 bg-mauve text-base font-semibold rounded-full hover:bg-mauve/80 transition-all duration-300 shadow-lg shadow-mauve/20 group"
            >
              <Mail className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Send me an email
            </Link>
            
            <Link
              href="https://www.linkedin.com/in/fabio-canavarro-584b232a7/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-surface0 text-text font-semibold rounded-full border border-surface1 hover:bg-surface1 hover:border-surface2 transition-all duration-300 group"
            >
              <Send className="w-5 h-5 mr-2 text-blue group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              Connect on LinkedIn
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
