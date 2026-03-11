import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000"),
  title: {
    default: "Campaign Tracker",
    template: "%s | Campaign Tracker",
  },
  description: "A lightweight campaign journal for tabletop RPG Dungeon Masters. Track sessions, NPCs, locations, and plot threads in one place.",
  keywords: [
    "Campaign Tracker",
    "RPG campaign journal",
    "D&D campaign tracker",
    "Dungeon master tools",
    "TTRPG notes",
    "tabletop RPG",
  ],
  openGraph: {
    type: "website",
    siteName: "Campaign Tracker",
    title: "Campaign Tracker",
    description: "A lightweight campaign journal for tabletop RPG Dungeon Masters.",
    images: [{ url: "/hero-splash.png", width: 1200, height: 630, alt: "Campaign Tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campaign Tracker",
    description: "A lightweight campaign journal for tabletop RPG Dungeon Masters.",
    images: ["/hero-splash.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}})()`,
          }}
        />
      </head>
      <body className={`${geist.variable} ${fraunces.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
