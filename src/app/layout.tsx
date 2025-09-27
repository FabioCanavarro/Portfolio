import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./_components/nav-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="EtXQSUeHBtrxo-KILNVrvuwaKY3s-icWml486RK52F4" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-y-scroll no-scrollbar`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
