import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata = {
  title:       "Projekkt — Editorial Review & Rewriting",
  description: "Upload your document. We review every section, identify anything that could raise questions, and rewrite it so the whole thing reads as naturally yours.",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
  themeColor: "#c8ff00",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Projekkt",
  },
  openGraph: {
    title:       "Projekkt — Editorial Review & Rewriting",
    description: "Upload your document. We review every section and rewrite anything that could raise questions.",
    url:         "https://projekkt.shaddies.space",
    siteName:    "Projekkt",
    type:        "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PWA — iOS Safari needs these as plain meta tags, Next.js metadata doesn't cover all of them */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Projekkt" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
