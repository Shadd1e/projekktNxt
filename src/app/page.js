"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const STEPS = [
  { n: "01", title: "Upload your .docx",   body: "Drop your document. We accept .docx files up to 10MB. Images inside are skipped — text only." },
  { n: "02", title: "We scan everything",   body: "AI detection, web plagiarism via Brave Search, academic plagiarism via OpenAlex — all three, simultaneously." },
  { n: "03", title: "DeepSeek rewrites it", body: "Flagged paragraphs get a full rewrite pass, then a humanization layer so it reads like you wrote it." },
  { n: "04", title: "Download your doc",   body: "Edited paragraphs are highlighted green. Report shows exactly what changed and why." },
];

const PLANS = [
  { id: "per_doc", label: "Per Document", price: "₦1,500",  desc: "One document. Pay, upload, done.",    cta: "Get started" },
  { id: "weekly",  label: "Weekly",       price: "₦5,000",  desc: "Unlimited docs for 7 days.",          cta: "Start weekly",  popular: true },
  { id: "monthly", label: "Monthly",      price: "₦15,000", desc: "Unlimited docs for 30 days.",         cta: "Go monthly" },
];

export default function HomePage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const tags = ["Plagiarism", "AI Detection", "Rewriting", "Humanization"];
  const current = tags[tick % tags.length];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Nav ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 99, borderBottom: "1px solid var(--border)", background: "rgba(7,7,9,0.92)", backdropFilter: "blur(16px)" }}>
        <div style={{ maxWidth: 1080, margin: "auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="mono" style={{ fontSize: 16, fontWeight: 500, color: "var(--accent)", letterSpacing: "0.08em" }}>PROJEKKT</span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/login"    className="btn btn-outline" style={{ padding: "8px 18px", fontSize: 13 }}>Log in</Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>Sign up free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ paddingTop: 140, paddingBottom: 100, paddingLeft: 24, paddingRight: 24, maxWidth: 1080, margin: "auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 32, padding: "6px 14px", border: "1px solid var(--border)", borderRadius: 20 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>plagiarism + AI detection + rewriting</span>
        </div>

        <h1 style={{ fontSize: "clamp(40px,7vw,80px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: 28 }}>
          Your document.<br />
          <span style={{ color: "var(--accent)" }}>Cleaned up.</span>
        </h1>

        <p style={{ fontSize: "clamp(16px,2vw,20px)", color: "var(--muted)", maxWidth: 560, lineHeight: 1.7, marginBottom: 44 }}>
          Upload a .docx file. Projekkt detects plagiarism, flags AI-written sections, rewrites everything with DeepSeek, and hands you back a clean document.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/register" className="btn btn-primary btn-lg">Upload a document →</Link>
          <Link href="#how" className="btn btn-outline btn-lg">See how it works</Link>
        </div>

        {/* floating tag */}
        <div style={{ marginTop: 60, display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>Currently scanning:</span>
          <span key={current} className="mono badge badge-green" style={{ fontSize: 12, animation: "fadeIn 0.4s ease" }}>{current}</span>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" style={{ padding: "80px 24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1080, margin: "auto" }}>
          <p className="mono" style={{ fontSize: 12, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>How it works</p>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 60 }}>Four steps. Clean document.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 24 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ padding: 28, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
                <span className="mono" style={{ fontSize: 12, color: "var(--accent)", display: "block", marginBottom: 14 }}>{s.n}</span>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.65 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "80px 24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1080, margin: "auto" }}>
          <p className="mono" style={{ fontSize: 12, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Pricing</p>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 12 }}>No subscriptions by default.</h2>
          <p style={{ fontSize: 16, color: "var(--muted)", marginBottom: 56 }}>Pay per doc, or go unlimited for a week or month. No auto-renewals.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {PLANS.map(p => (
              <div key={p.id} style={{
                padding: 32,
                background: p.popular ? "rgba(200,255,0,0.05)" : "var(--surface)",
                border: `1px solid ${p.popular ? "rgba(200,255,0,0.3)" : "var(--border)"}`,
                borderRadius: 12,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}>
                {p.popular && <span className="mono badge badge-green" style={{ position: "absolute", top: 20, right: 20, fontSize: 10 }}>Popular</span>}
                <span className="mono" style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.label}</span>
                <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" }}>{p.price}</div>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{p.desc}</p>
                <Link href="/register" className={`btn ${p.popular ? "btn-primary" : "btn-outline"} btn-lg`} style={{ marginTop: "auto" }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px 24px", textAlign: "center" }}>
        <p className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
          PROJEKKT by{" "}
          <a href="https://shaddies.space" style={{ color: "var(--accent)", textDecoration: "none" }}>Shaddies Space</a>
          {" "}— {new Date().getFullYear()}
        </p>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
