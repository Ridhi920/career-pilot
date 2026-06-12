import type { Metadata } from "next";
import { Unbounded, Archivo, IBM_Plex_Mono } from "next/font/google";
// @ts-ignore: side-effect import of CSS module
import "./globals.css";
import { Providers } from "./providers";

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-display",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Career Pilot",
  description:
    "AI career copilot: improve your resume, find matching jobs, track applications, and practice interviews.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${archivo.variable} ${unbounded.variable} ${plexMono.variable}`}
    >
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
