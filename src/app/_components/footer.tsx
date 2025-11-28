import { Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 text-center py-8">
      <div id="contact" className="absolute -top-24"></div>
      <p className="text-subtext1 mb-2">
        Let&apos;s connect and build something amazing.
      </p>
      <a
        href="mailto:fabiocanavarrotoh@gmail.com"
        className="text-lg text-mauve hover:underline"
      >
        fabiocanavarrotoh@gmail.com
      </a>
      <div className="flex justify-center space-x-6 mt-4">
        <a
          href="https://github.com/FabioCanavarro"
          target="_blank"
          rel="noopener noreferrer"
          className="text-subtext1 hover:text-mauve transition-colors duration-300"
        >
          <Github size={24} />
        </a>
        <a
          href="https://www.linkedin.com/in/fabio-canavarro-584b232a7/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-subtext1 hover:text-blue transition-colors duration-300"
        >
          <Linkedin size={24} />
        </a>
      </div>
      <p className="text-base text-surface2 mt-8">
        Designed & Built by Fabio Canavarro
      </p>
    </footer>
  );
}
