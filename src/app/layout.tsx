import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mark Renzo — AI builder & product developer",
  description:
    "I’m Mark Renzo. I turn ideas into apps, useful tools and automations with AI. Explore the projects, see how they work, and try out an idea of your own.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/jersey-10-regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/dm-sans-variable.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/ibm-plex-mono-regular.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
