import type { Metadata, Viewport } from "next";
// Polices auto-hébergées (@fontsource-variable) plutôt que next/font/google :
// 1. le build ne dépend plus d'un appel réseau à Google Fonts — il échouait
//    réellement en `Failed to fetch` quand le CDN était injoignable ;
// 2. les .woff2 sont servis depuis notre propre origine, donc précachables
//    par le service worker (règle CacheFirst `destination === "font"` de
//    sw.ts), ce qui rend la typographie disponible dès le premier chargement
//    hors-ligne — cohérent avec l'offline-first (CLAUDE.md règle 1) et avec
//    05-DESIGN-SYSTEM.md qui recommande explicitement l'auto-hébergement.
// `wght.css` = axe de graisse variable, couvre 400–700 en un seul fichier.
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/space-grotesk/wght.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ParentRelais",
  description:
    "Boîte à outils numérique hors-ligne des facilitateurs de parentalité positive — UNICEF Cameroon × MINPROFF.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // iOS Safari ignore le manifest pour l'icône d'accueil et exige un PNG
    // raster — le SVG seul laissait l'app sans icône fonctionnelle sur iOS.
    apple: "/apple-touch-icon.png",
  },
  // iOS ignore une grande partie du manifest : sans ces meta, l'app lancée
  // depuis l'écran d'accueil rouvre dans Safari avec sa barre d'URL au lieu
  // du mode standalone, et la barre de statut n'est pas thématisée.
  appleWebApp: {
    capable: true,
    title: "ParentRelais",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C7C9A",
  width: "device-width",
  initialScale: 1,
  // Sans viewportFit "cover", le contenu s'arrête au-dessus de l'encoche et
  // des coins arrondis sur iPhone en mode standalone : bandes vides en haut
  // et en bas. Avec, la page occupe tout l'écran et les zones sûres sont
  // gérées par les env(safe-area-inset-*) posés dans globals.css.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
