import "./globals.css";

export const metadata = {
  title:       "Projekkt — Editorial Review & Rewriting",
  description: "Upload your document. We review every section, identify anything that could raise questions, and rewrite it so the whole thing reads as naturally yours.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
