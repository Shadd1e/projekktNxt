import "./globals.css";

export const metadata = {
  title:       "Projekkt — Plagiarism & AI Detection",
  description: "Upload your document. We detect plagiarism, flag AI-written sections, and rewrite everything clean.",
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
