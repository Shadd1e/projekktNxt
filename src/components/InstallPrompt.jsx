"use client";
// ─────────────────────────────────────────────────────────────────────────────
// InstallPrompt.jsx
// Drop this anywhere in your layout — it auto-shows after 4s on supported
// browsers (Chrome Android, Edge, some desktop Chrome) when the PWA criteria
// are met. On iOS Safari it shows manual instructions since that browser
// doesn't support the beforeinstallprompt event.
//
// Usage in src/app/layout.js:
//   import InstallPrompt from "@/components/InstallPrompt";
//   ...
//   <body>
//     {children}
//     <InstallPrompt />
//   </body>
//
// Also make sure you have src/app/manifest.json and a service worker set up.
// See the manifest template at the bottom of this file.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [prompt, setPrompt]   = useState(null);  // beforeinstallprompt event
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS]     = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed in this session or installed
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("pwa_dismissed")) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return; // already installed

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Chrome/Edge Android + desktop Chrome
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setTimeout(() => setVisible(true), 4000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show manual instruction after delay
    if (ios) setTimeout(() => setVisible(true), 4000);

    // Hide if installed
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setVisible(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem("pwa_dismissed", "1");
  }

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setVisible(false);
  }

  if (!visible || installed) return null;

  return (
    <>
      {/* Backdrop — subtle, not modal */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 998,
          background: "rgba(0,0,0,0.18)",
          animation: "pwaFadeIn 0.25s ease",
        }}
      />

      {/* Popup card */}
      <div style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        width: "min(420px, calc(100vw - 32px))",
        background: "#070709",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 18,
        padding: "24px 24px 20px",
        boxShadow: "0 8px 48px rgba(0,0,0,0.4)",
        animation: "pwaSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        fontFamily: "'Cabinet Grotesk', sans-serif",
      }}>

        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(255,255,255,0.07)",
            border: "none", borderRadius: "50%",
            width: 28, height: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.5)",
            fontSize: 16, lineHeight: 1,
          }}>
          ×
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          {/* App icon — green square with "P" */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: "#c8ff00",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 22, fontWeight: 700, color: "#070709", letterSpacing: "-0.04em",
            }}>P</span>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
              Add Projekkt to your home screen
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
              projekkt.shaddies.space
            </div>
          </div>
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 20 }}>
          {isIOS
            ? "Open like any app. No download needed — works straight from your home screen."
            : "Install the web app for faster access. No App Store. No download. Just tap."}
        </p>

        {/* iOS instructions */}
        {isIOS ? (
          <div style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "14px 16px",
            marginBottom: 16,
          }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              How to install on iOS
            </p>
            {[
              { icon: "□↑", text: "Tap the Share button at the bottom of Safari" },
              { icon: "+□", text: "Scroll down and tap \"Add to Home Screen\"" },
              { icon: "✓",  text: "Tap Add — done. Find Projekkt on your home screen." },
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < 2 ? 10 : 0 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#c8ff00", flexShrink: 0, marginTop: 2, minWidth: 20 }}>{step.icon}</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{step.text}</span>
              </div>
            ))}
          </div>
        ) : (
          // Native install button for Chrome/Edge
          <button
            onClick={install}
            style={{
              width: "100%", padding: "13px 20px",
              background: "#c8ff00", color: "#070709",
              border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 800,
              cursor: "pointer", marginBottom: 10,
              fontFamily: "'Cabinet Grotesk', sans-serif",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            Install app →
          </button>
        )}

        <button
          onClick={dismiss}
          style={{
            width: "100%", padding: "10px",
            background: "transparent", color: "rgba(255,255,255,0.35)",
            border: "none", fontSize: 13, cursor: "pointer",
            fontFamily: "'Cabinet Grotesk', sans-serif",
          }}>
          Not now
        </button>
      </div>

      <style>{`
        @keyframes pwaFadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes pwaSlideUp  { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>
    </>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// MANIFEST — save as src/app/manifest.json (Next.js picks it up automatically)
// ─────────────────────────────────────────────────────────────────────────────
/*
{
  "name": "Projekkt",
  "short_name": "Projekkt",
  "description": "Document editing — similarity review, editorial rewrite, tone matching.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#070709",
  "theme_color": "#c8ff00",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "categories": ["productivity", "education"],
  "lang": "en"
}
*/
