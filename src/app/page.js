"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const AUDIENCES = [
  {
    tag:   "For students",
    label: "Submitting an assignment or dissertation?",
    body:  "We read your document like a strict lecturer would — flagging borrowed phrasing, inconsistent tone, and sections that don't sound like you. Then we edit them so the whole thing reads as one coherent, original piece of work.",
    cta:   "Polish my document →",
  },
  {
    tag:   "For researchers",
    label: "Academic paper need a clean editorial pass?",
    body:  "We check your writing against academic databases and the live web for similarity, identify sections that could raise questions, and rewrite them with your argument and citations fully intact.",
    cta:   "Clean up my paper →",
  },
  {
    tag:   "For professionals",
    label: "Report or proposal borrowed too heavily from a source?",
    body:  "Reports, proposals, whitepapers — we identify over-similar passages and rewrite them in a natural, professional register so your document reads as entirely your own work.",
    cta:   "Fix my document →",
  },
];

const STEPS = [
  { n: "01", title: "Upload your .docx",
    body: "Drop your document. Up to 10MB. Essays, reports, dissertations — if it is in .docx format, we can work with it. Tables are processed; images are left untouched.",
    explainer: "Supported: essays, dissertations, reports. Just convert your file to .docx in Word or Google Docs first." },
  { n: "02", title: "We read it closely",
    body: "Every paragraph gets a thorough review — checked for similarity to published sources, academic papers, and web content, plus anything that reads inconsistently with the rest of your voice.",
    explainer: "We never store your document permanently — it's automatically deleted from our servers within 1 hour." },
  { n: "03", title: "We rewrite what needs it",
    body: "Flagged sections get a full editorial rewrite — restructured, rephrased, and matched to the tone of the rest of your document. Nothing sounds borrowed.",
    explainer: "Your argument and voice are preserved — we restructure sentences, not your ideas." },
  { n: "04", title: "Download your document",
    body: "Edited sections are highlighted green in the file so you can review every change. A full report shows exactly what was rewritten and why.",
    explainer: "You get back the exact same .docx format — fonts, layout, and references all intact." },
];

const BUNDLES = [
  { label: "Starter",  price: "₦2,000",  credits: "2,000",  desc: "Best for a single assignment" },
  { label: "Standard", price: "₦5,000",  credits: "5,500",  desc: "Best value — save 10%", popular: true, bonus: "+500 free" },
  { label: "Pro",      price: "₦10,000", credits: "12,000", desc: "Heavy users",   bonus: "+2,000 free" },
  { label: "Studio",   price: "₦20,000", credits: "26,000", desc: "Teams",         bonus: "+6,000 free" },
];

const FAQS = [
  { q: "What file types do you accept?",         a: "Only .docx files, up to 10MB. If your document is in another format, convert it first — Word, Google Docs, and LibreOffice all export to .docx." },
  { q: "What happens to my document after?",     a: "Your file is automatically deleted from our servers one hour after processing. We never store document content permanently and never use it for any purpose beyond the editing pass." },
  { q: "Are tables processed?",                  a: "Yes. Text inside table cells is reviewed and rewritten if needed. The table structure — rows, columns, formatting — is fully preserved." },
  { q: "Do credits expire?",                     a: "No. Credits never expire. Buy once, use whenever you need." },
  { q: "How does the similarity check work?",    a: "We check your writing against a large index of published academic papers and the live web. Any passage with a high degree of similarity to an existing source gets flagged for rewriting." },
  { q: "Can I use this for my thesis?",          a: "Yes. Many of our users are students submitting dissertations and final-year projects. The editorial review is thorough enough to catch the kinds of issues academic integrity checks are designed to find." },
];

export default function HomePage() {
  const [audienceIdx, setAudienceIdx]   = useState(0);
  const [tick, setTick]                 = useState(0);
  const [faqOpen, setFaqOpen]           = useState(null);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const [wordCount, setWordCount]       = useState("");

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 3200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("outreach_dismissed")) return;
    const t = setTimeout(() => setShowOutreach(true), 5000);
    return () => clearTimeout(t);
  }, []);

  function dismissOutreach() {
    setShowOutreach(false);
    localStorage.setItem("outreach_dismissed", "1");
  }

  const tags    = ["Similarity review", "Editorial rewrite", "Tone matching", "Source checking"];
  const current = tags[tick % tags.length];
  const aud     = AUDIENCES[audienceIdx];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'Cabinet Grotesk', sans-serif" }}>

      {/* ── Nav ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 99, borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.94)", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1080, margin: "auto", padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="mono" style={{ fontSize: 15, fontWeight: 500, color: "var(--accent)", letterSpacing: "0.1em" }}>PROJEKKT</span>

          {/* Desktop nav */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }} className="desktop-nav">
            <a href="#how" style={{ fontSize: 14, color: "var(--muted)", textDecoration: "none", padding: "6px 10px" }}
              onMouseEnter={e => e.target.style.color = "var(--text)"}
              onMouseLeave={e => e.target.style.color = "var(--muted)"}>How it works</a>
            <a href="#pricing" style={{ fontSize: 14, color: "var(--muted)", textDecoration: "none", padding: "6px 10px" }}
              onMouseEnter={e => e.target.style.color = "var(--text)"}
              onMouseLeave={e => e.target.style.color = "var(--muted)"}>Pricing</a>
            <Link href="/login" className="btn btn-outline" style={{ padding: "7px 16px", fontSize: 13 }}>Log in</Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: "7px 16px", fontSize: 13 }}>Get started</Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(o => !o)} className="mobile-menu-btn"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", fontSize: 20, padding: 4 }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <a href="#how" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, color: "var(--muted)", textDecoration: "none" }}>How it works</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, color: "var(--muted)", textDecoration: "none" }}>Pricing</a>
            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
              <Link href="/login" className="btn btn-outline" style={{ flex: 1, fontSize: 14 }}>Log in</Link>
              <Link href="/register" className="btn btn-primary" style={{ flex: 1, fontSize: 14 }}>Get started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section style={{ paddingTop: "clamp(100px,15vw,140px)", paddingBottom: 80, paddingLeft: 20, paddingRight: 20, maxWidth: 1080, margin: "auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28, padding: "5px 14px", border: "1px solid var(--border)", borderRadius: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>similarity review · editorial rewrite · tone matching</span>
        </div>

        <h1 style={{ fontSize: "clamp(36px,7vw,78px)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.03em", marginBottom: 24 }}>
          Your document, polished.<br />
          <span style={{ color: "var(--accent)" }}>Submit something worth your name.</span>
        </h1>

        <p style={{ fontSize: "clamp(15px,2vw,19px)", color: "var(--text2)", maxWidth: 540, lineHeight: 1.7, marginBottom: 36 }}>
          Upload your .docx. We review every section, identify anything that could raise questions, and rewrite it so the whole document reads as consistently, naturally yours — credits deducted only for what we actually edit.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 56 }}>
          <Link href="/register" className="btn btn-primary btn-lg">Start for free →</Link>
          <a href="#how" className="btn btn-outline btn-lg">See how it works</a>
        </div>

        {/* Rotating tag */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>Now reviewing:</span>
          <span key={current} className="mono badge badge-green" style={{ fontSize: 11, animation: "fadeIn 0.4s ease" }}>{current}</span>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section style={{ padding: "72px 20px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1080, margin: "auto" }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Who it's for</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.025em", marginBottom: 40 }}>Built for anyone with a deadline.</h2>

          {/* Audience toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
            {AUDIENCES.map((a, i) => (
              <button key={i} onClick={() => setAudienceIdx(i)}
                style={{
                  padding: "8px 18px", borderRadius: 20, border: "1px solid",
                  borderColor: audienceIdx === i ? "rgba(92,59,255,0.35)" : "var(--border)",
                  background: audienceIdx === i ? "rgba(92,59,255,0.07)" : "transparent",
                  color: audienceIdx === i ? "var(--accent)" : "var(--muted)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Cabinet Grotesk',sans-serif",
                  transition: "all 0.15s",
                }}>
                {a.tag}
              </button>
            ))}
          </div>

          {/* Active audience card */}
          <div key={audienceIdx} style={{
            padding: "clamp(24px,4vw,40px)",
            background: "var(--surface)",
            border: "1px solid rgba(92,59,255,0.15)",
            borderRadius: 16,
            animation: "fadeIn 0.3s ease",
          }}>
            <h3 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, marginBottom: 14, letterSpacing: "-0.02em" }}>{aud.label}</h3>
            <p style={{ fontSize: "clamp(14px,2vw,17px)", color: "var(--text2)", lineHeight: 1.7, maxWidth: 600, marginBottom: 24 }}>{aud.body}</p>
            <Link href="/register" className="btn btn-primary">{aud.cta}</Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" style={{ padding: "72px 20px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1080, margin: "auto" }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>How it works</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.025em", marginBottom: 48 }}>Four steps. Clean document.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ padding: 24, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--accent)", display: "block", marginBottom: 12, opacity: 0.7 }}>{s.n}</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.65 }}>{s.body}</p>
                {s.explainer && <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginTop: 10 }}>{s.explainer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "72px 20px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1080, margin: "auto" }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Pricing</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.025em", marginBottom: 10 }}>Buy credits. Use them anytime.</h2>
          <p style={{ fontSize: 16, color: "var(--text2)", marginBottom: 14 }}>
            ₦0.50 per word. Credits never expire. Bigger bundles include free bonus credits.
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 32 }}>
            A 2,000-word essay costs roughly 1,000 credits. A 10,000-word dissertation costs roughly 5,000 credits.
          </p>

          {/* Credit cost estimator */}
          <div style={{ marginBottom: 40, padding: "18px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text2)", whiteSpace: "nowrap" }}>Estimate your cost</label>
            <input
              type="number"
              min="0"
              placeholder="Word count"
              value={wordCount}
              onChange={e => setWordCount(e.target.value)}
              style={{
                padding: "9px 14px", borderRadius: "var(--radius)",
                border: "1px solid var(--border2)", background: "var(--surface2)",
                color: "var(--text)", fontSize: 14, fontFamily: "'Cabinet Grotesk',sans-serif",
                outline: "none", width: 150,
              }}
            />
            {Number(wordCount) > 0 && (
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>
                ~{Math.ceil(Number(wordCount) * 0.5).toLocaleString()} credits needed (₦{Math.ceil(Number(wordCount) * 0.5).toLocaleString()})
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
            {BUNDLES.map(b => (
              <div key={b.label} style={{
                padding: 24,
                background: b.popular ? "rgba(92,59,255,0.04)" : "var(--surface)",
                border: `1px solid ${b.popular ? "rgba(92,59,255,0.25)" : "var(--border)"}`,
                borderRadius: 14,
                position: "relative",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                {b.popular && <span className="badge badge-green" style={{ position: "absolute", top: 14, right: 14, fontSize: 9 }}>Popular</span>}
                <span className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{b.label}</span>
                <div style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 900, letterSpacing: "-0.02em" }}>{b.price}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>{b.credits} credits</span>
                  {b.bonus && <span className="badge badge-gold" style={{ fontSize: 9 }}>{b.bonus}</span>}
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)" }}>{b.desc}</p>
                <Link href="/register" className={`btn ${b.popular ? "btn-primary" : "btn-outline"}`} style={{ marginTop: "auto", width: "100%" }}>
                  Get {b.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "72px 20px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 680, margin: "auto" }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>FAQ</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-0.025em", marginBottom: 40 }}>Common questions.</h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {FAQS.map((f, i) => (
              <div key={i} style={{ borderTop: "1px solid var(--border)", padding: "18px 0", cursor: "pointer" }} onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{f.q}</span>
                  <span style={{ color: "var(--accent)", fontSize: 18, flexShrink: 0, transition: "transform 0.2s", transform: faqOpen === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                </div>
                {faqOpen === i && (
                  <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, marginTop: 12, animation: "fadeIn 0.2s ease" }}>{f.a}</p>
                )}
              </div>
            ))}
            <div style={{ borderTop: "1px solid var(--border)" }} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "72px 20px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "auto" }}>
          <h2 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16 }}>
            Submit something<br /><span style={{ color: "var(--accent)" }}>you're proud of.</span>
          </h2>
          <p style={{ fontSize: 16, color: "var(--text2)", marginBottom: 32, lineHeight: 1.7 }}>
            Students, researchers, and professionals use Projekkt to make sure their work reads as their best — before it counts.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg">Get started — it's free to sign up</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 20px" }}>
        <div style={{ maxWidth: 1080, margin: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>PROJEKKT — by <a href="https://shaddies.space" style={{ color: "var(--accent)", textDecoration: "none" }}>Shaddies Space</a></span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/login" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>Log in</Link>
            <Link href="/register" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>Sign up</Link>
          </div>
        </div>
      </footer>

      {/* ── Floating outreach button ── */}
      {showOutreach && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 200,
          display: "flex", alignItems: "center", gap: 8,
          animation: "outreachFadeIn 0.5s ease forwards",
        }}>
          <a href="mailto:hello@shaddies.space" className="btn btn-primary"
            style={{ borderRadius: 999, padding: "12px 22px", fontSize: 14, boxShadow: "0 4px 24px rgba(92,59,255,0.28)" }}>
            Want someone to handle your project? Reach out →
          </a>
          <button onClick={dismissOutreach} aria-label="Dismiss"
            style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "50%", width: 34, height: 34, cursor: "pointer",
              color: "var(--muted)", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}>
            ×
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse        { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn       { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes outreachFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .desktop-nav { display: flex; }
        .mobile-menu-btn { display: none; }
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
}
