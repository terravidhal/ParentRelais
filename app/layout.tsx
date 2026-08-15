import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ParentRelais",
  description:
    "Boîte à outils numérique hors-ligne des facilitateurs de parentalité positive — UNICEF Cameroon × MINPROFF.",
  manifest: "/manifest.webmanifest",
  icons: {
    // TODO Phase 1 : remplacer par le vrai logo ParentRelais/UNICEF une fois fourni.
    // iOS Safari ignore le manifest pour l'icône d'accueil et exige un raster —
    // le SVG suffit pour Chrome/Edge/Firefox Android en Phase 0.
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C7C9A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
