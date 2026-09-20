import { Inter, JetBrains_Mono } from "next/font/google";

// Display / body copy — bold, clean grotesk.
export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Technical labels, nav, specs, badges — uppercase + tracked wherever used.
export const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
