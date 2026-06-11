"use client";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";

const AUDIENCES = [
  {
    tag: "For students",
    label: "Submitting an assignment or dissertation?",
    body: "We read your document like a strict lecturer would — flagging borrowed phrasing, inconsistent tone, and sections that don't sound like you. Then we edit them so the whole thing reads as one coherent, original piece of work.",
    cta: "Polish my document →",
  },
  {
    tag: "For researchers",
    label: "Academic paper need a clean editorial pass?",
    body: "We check your writing against academic databases and the live web for similarity, identify sections that could raise questions, and rewrite them with your argument and citations fully intact.",
    cta: "Clean up my paper →",
  },
  {
    tag: "For professionals",
    label: "Report or proposal borrowed too heavily from a source?",
    body: "Reports, proposals, whitepapers — we identify over-similar passages and rewrite them in a natural, professional register so your document reads as entirely your own work.",
    cta: "Fix my document →",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Upload your .docx",
    body: "Drop your document — up to 10MB. Essays, reports, dissertations. Tables are processed; images are left untouched.",
    strength: "rgba(92,59,255,0.15)",
  },
  {
    n: "02",
    title: "We read it closely",
    body: "Every paragraph is checked for similarity to published sources, academic papers, and web content.",
    strength: "rgba(92,59,255,0.3)",
  },
  {
    n: "03",
    title: "We rewrite what needs it",
    body: "Flagged sections get a full editorial rewrite — rephrased, restructured, and matched to your voice.",
    strength: "rgba(92,59,255,0.55)",
  },
  {
    n: "04",
    title: "Download your document",
    body: "Edits highlighted green. Full report showing exactly what was rewritten and why. Same .docx format.",
    strength: "#5c3bff",
    highlight: true,
  },
];

const BUNDLES = [
  { id: "starter",  label: "Starter",  price: "₦2,000",  credits: "2,000",  desc: "Best for a single assignment", bonus: null, popular: false },
  { id: "standard", label: "Standard", price: "₦5,000",  credits: "5,500",  desc: "Best value — save 10%",        bonus: "+500 free",   popular: true },
  { id: "pro",      label: "Pro",      price: "₦10,000", credits: "12,000", desc: "Heavy users",                   bonus: "+2,000 free", popular: false },
  { id: "studio",   label: "Studio",   price: "₦20,000", credits: "26,000", desc: "Teams",                         bonus: "+6,000 free", popular: false },
];

const PRIVACY_STATS = [
  { val: "1 hour", label: "Auto-deleted in", sub: "Every file, automatically.", span: 2 },
  { val: "0", label: "Documents permanently stored", span: 1 },
  { val: "0", label: "Third parties with your data", span: 1 },
];

const FAQS = [
  { q: "What file types do you accept?",      a: "Only .docx files, up to 10MB. If your document is in another format, convert it first — Word, Google Docs, and LibreOffice all export to .docx." },
  { q: "What happens to my document after?",  a: "Your file is automatically deleted from our servers one hour after processing. We never store document content permanently and never use it for any purpose beyond the editing pass." },
  { q: "Are tables processed?",               a: "Yes. Text inside table cells is reviewed and rewritten if needed. The table structure — rows, columns, formatting — is fully preserved." },
  { q: "Do credits expire?",                  a: "No. Credits never expire. Buy once, use whenever you need." },
  { q: "How does the similarity check work?", a: "We check your writing against a large index of published academic papers and the live web. Any passage with a high degree of similarity to an existing source gets flagged for rewriting." },
  { q: "Can I use this for my thesis?",       a: "Yes. Many of our users are students submitting dissertations and final-year projects. The editorial review is thorough enough to catch the kinds of issues academic integrity checks are designed to find." },
];

// ── Hero illustration — animated text transformation ──────────────────────────
function HeroCard() {
  const [phase, setPhase] = useState("original"); // original | rewriting | rewritten | stats

  useEffect(() => {
    const sequence = [
      { delay: 1800, next: "rewriting" },
      { delay: 2600, next: "rewritten" },
      { delay: 3400, next: "stats" },
      { delay: 6000, next: "original" },
    ];
    let timers = [];
    let offset = 0;
    function run() {
      sequence.forEach(({ delay, next }) => {
        const t = setTimeout(() => setPhase(next), offset + delay);
        timers.push(t);
      });
      offset = 0;
    }
    run();
    const loop = setInterval(() => { timers.forEach(clearTimeout); timers = []; run(); }, 7200);
    return () => { timers.forEach(clearTimeout); clearInterval(loop); };
  }, []);

  const showArrow    = phase === "rewriting" || phase === "rewritten" || phase === "stats";
  const showRewritten = phase === "rewritten" || phase === "stats";
  const showStats    = phase === "stats";

  return (
    <div style={{
      width: "100%", maxWidth: 420, background: "#fff",
      border: "1.5px solid rgba(92,59,255,0.18)", borderRadius: 20,
      padding: 28, position: "relative", overflow: "hidden",
      boxShadow: "0 2px 40px rgba(92,59,255,0.08), 0 0 0 6px rgba(92,59,255,0.04)",
    }}>
      {/* Floating outline shapes */}
      <div style={{ position:"absolute", top:-18, right:-18, width:72, height:72, border:"2px solid rgba(92,59,255,0.15)", borderRadius:"50%", pointerEvents:"none", animation:"pkfloat1 5s ease-in-out infinite" }} />
      <div style={{ position:"absolute", bottom:12, left:-14, width:44, height:44, border:"2px solid rgba(92,59,255,0.12)", borderRadius:8, transform:"rotate(20deg)", pointerEvents:"none", animation:"pkfloat2 6s ease-in-out infinite" }} />
      <div style={{ position:"absolute", top:"40%", right:-10, width:24, height:24, border:"2px solid rgba(92,59,255,0.1)", transform:"rotate(45deg)", pointerEvents:"none", animation:"pkfloat1 4s ease-in-out infinite 1s" }} />

      {/* Card header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:28, height:28, background:"rgba(92,59,255,0.1)", border:"1px solid rgba(92,59,255,0.2)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5c3bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <span className="mono" style={{ fontSize:11, color:"rgba(13,13,18,0.45)" }}>essay_final.docx</span>
        </div>
        <span className="badge badge-green">Processing</span>
      </div>

      {/* Original text */}
      <div style={{ marginBottom:8, padding:"12px 14px", background:"rgba(255,85,85,0.05)", border:"1px solid rgba(255,85,85,0.15)", borderRadius:8, fontSize:12.5, color:"#4a4a5a", lineHeight:1.7, transition:"opacity 0.6s, transform 0.6s", opacity: phase === "original" ? 1 : 0.3, transform: phase === "original" ? "translateY(0)" : "translateY(-3px)" }}>
        <span className="mono" style={{ fontSize:10, color:"rgba(13,13,18,0.35)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:8 }}>¶ Paragraph 3 — flagged</span>
        "The process of photosynthesis involves the conversion of light energy into chemical energy, which is stored in glucose molecules and subsequently used by organisms for various metabolic processes."
      </div>

      {/* Arrow */}
      <div style={{ textAlign:"center", marginBottom:8, opacity: showArrow ? 1 : 0, transition:"opacity 0.4s" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
          <div style={{ width:1, height:18, background:"rgba(92,59,255,0.3)" }} />
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft:-6 }}>
            <path d="M6 2v8M2 6l4 4 4-4" stroke="#5c3bff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="mono" style={{ fontSize:10, color:"#5c3bff", letterSpacing:"0.06em" }}>REWRITING</span>
        </div>
      </div>

      {/* Rewritten text */}
      <div style={{ marginBottom:20, padding:"12px 14px", background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:8, fontSize:12.5, color:"#0d0d12", lineHeight:1.7, opacity: showRewritten ? 1 : 0, transform: showRewritten ? "translateY(0)" : "translateY(6px)", transition:"opacity 0.6s, transform 0.6s" }}>
        "Plants capture sunlight and use it to build sugar molecules — a form of stored energy that fuels everything from cell division to growth across the natural world."
      </div>

      {/* Stats row */}
      <div style={{ display:"flex", gap:8, opacity: showStats ? 1 : 0, transition:"opacity 0.5s" }}>
        {[{ val:"4", label:"Rewritten" }, { val:"12", label:"Checked" }, { val:"✓", label:"Ready", green:true }].map(s => (
          <div key={s.label} style={{ flex:1, padding:10, background:"#f4f4f7", borderRadius:8, textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:900, color: s.green ? "#16a34a" : s.label === "Rewritten" ? "#5c3bff" : "#0d0d12" }}>{s.val}</div>
            <div className="mono" style={{ fontSize:9, color:"rgba(13,13,18,0.4)", textTransform:"uppercase", marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FAQ item ──────────────────────────────────────────────────────────────────
function FaqItem({ q, a, isOpen, onToggle }) {
  return (
    <div style={{ borderTop:"1px solid rgba(0,0,0,0.08)", padding:"18px 0", cursor:"pointer" }} onClick={onToggle}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:16 }}>
        <span style={{ fontSize:15, fontWeight:600 }}>{q}</span>
        <span style={{ color:"var(--accent)", fontSize:20, flexShrink:0, transition:"transform 0.2s", transform: isOpen ? "rotate(45deg)" : "rotate(0)" }}>+</span>
      </div>
      {isOpen && (
        <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.7, marginTop:12, animation:"fadeIn 0.2s ease" }}>{a}</p>
      )}
    </div>
  );
}

// ── Hero drop-zone + guest scan widget ───────────────────────────────────────
function HeroScanner() {
  const [file, setFile]           = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const inputRef                  = useRef(null);

  const pickFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".docx")) { setError("Only .docx files are accepted."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("File must be under 10 MB."); return; }
    setFile(f); setResult(null); setError("");
  };

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  async function handleScan() {
    if (!file) return;
    setScanning(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/document/scan", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed.");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  function reset() { setFile(null); setResult(null); setError(""); }

  // ── After scan: show result + gate ───────────────────────────────────────
  if (result) {
    const clean = result.verdict === "clean";
    return (
      <div style={{
        background:"var(--surface)", border:"1px solid var(--border)",
        borderRadius:16, padding:"28px 24px", maxWidth:420, width:"100%",
        boxShadow:"0 8px 40px rgba(92,59,255,0.08)",
      }}>
        {/* Verdict badge */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <span style={{
            fontSize:22, fontWeight:900,
            color: clean ? "var(--accent)" : "var(--text)",
          }}>
            {clean ? "✓ Document looks clean" : "⚠ Issues found"}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--text2)" }}>
            <span>Sections scanned</span>
            <span style={{ fontWeight:700, color:"var(--text)" }}>{result.totalSections}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"var(--text2)" }}>
            <span>Sections flagged</span>
            <span style={{ fontWeight:700, color: result.flaggedSections > 0 ? "#e53e3e" : "var(--accent)" }}>
              {result.flaggedSections}
            </span>
          </div>
          {result.costLine && (
            <div style={{ marginTop:4, padding:"10px 14px", background:"rgba(229,62,62,0.06)", borderRadius:8, border:"1px solid rgba(229,62,62,0.15)", fontSize:13, color:"#c0392b", fontWeight:600 }}>
              {result.costLine}
            </div>
          )}
          {result.issueLines?.map((line, i) => (
            <div key={i} style={{ fontSize:12, color:"var(--muted)", paddingLeft:4 }}>· {line}</div>
          ))}
        </div>

        {/* Gate: must log in / sign up to process */}
        <div style={{ borderTop:"1px solid var(--border)", paddingTop:18 }}>
          <p style={{ fontSize:13, color:"var(--text2)", marginBottom:14, lineHeight:1.6 }}>
            {clean
              ? "Your document is clear. Sign in to run a full editorial pass and download the cleaned version."
              : "To fix these issues and download your corrected document, create a free account or log in."}
          </p>
          <div style={{ display:"flex", gap:10 }}>
            <Link href="/register" className="btn btn-primary" style={{ flex:1, textAlign:"center", fontSize:14 }}>
              Create free account →
            </Link>
            <Link href="/login" className="btn btn-outline" style={{ flex:"0 0 auto", fontSize:14 }}>
              Log in
            </Link>
          </div>
        </div>

        <button onClick={reset} style={{ marginTop:14, background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--muted)", textDecoration:"underline", display:"block", width:"100%", textAlign:"center" }}>
          Scan a different document
        </button>
      </div>
    );
  }

  // ── Drop zone ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth:420, width:"100%" }}>
      <div
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        onClick={() => !file && inputRef.current?.click()}
        style={{
          background: dragging ? "rgba(92,59,255,0.06)" : "var(--surface)",
          border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
          borderRadius:16, padding:"36px 28px", cursor: file ? "default" : "pointer",
          transition:"all 0.2s", textAlign:"center",
          boxShadow:"0 8px 40px rgba(92,59,255,0.07)",
        }}
      >
        <input ref={inputRef} type="file" accept=".docx" style={{ display:"none" }}
          onChange={e => pickFile(e.target.files?.[0])} />

        {!file ? (
          <>
            <div style={{ fontSize:40, marginBottom:12 }}>📄</div>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:6 }}>
              Drop your .docx here
            </div>
            <div style={{ fontSize:13, color:"var(--muted)", marginBottom:16 }}>
              or <span style={{ color:"var(--accent)", fontWeight:600, cursor:"pointer" }}>browse your files</span>
            </div>
            <div style={{ fontSize:11, color:"var(--muted)" }}>
              Up to 10 MB · .docx only · No login needed to scan
            </div>
          </>
        ) : (
          <div style={{ display:"flex", alignItems:"center", gap:12, textAlign:"left" }}>
            <span style={{ fontSize:28 }}>📄</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {file.name}
              </div>
              <div style={{ fontSize:12, color:"var(--muted)" }}>
                {(file.size / 1024).toFixed(0)} KB
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); reset(); }}
              style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:18, padding:4 }}>✕</button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop:10, fontSize:13, color:"#e53e3e", textAlign:"center" }}>{error}</div>
      )}

      <button
        onClick={handleScan}
        disabled={!file || scanning}
        className="btn btn-primary btn-lg"
        style={{ width:"100%", marginTop:14, opacity: (!file || scanning) ? 0.5 : 1 }}
      >
        {scanning ? (
          <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(0,0,0,0.2)", borderTopColor:"#000", borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />
            Scanning…
          </span>
        ) : "Scan document →"}
      </button>

      <div style={{ marginTop:12, display:"flex", justifyContent:"center", gap:20, flexWrap:"wrap" }}>
        {["No login required", "Free to scan", "Results in seconds"].map(t => (
          <span key={t} style={{ fontSize:11, color:"var(--muted)", display:"flex", alignItems:"center", gap:4 }}>
            <span style={{ color:"var(--accent)", fontWeight:700 }}>✓</span> {t}
          </span>
        ))}
      </div>
    </div>
  );
}



// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [faqOpen, setFaqOpen]       = useState(null);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("outreach_dismissed")) return;
    const t = setTimeout(() => setShowOutreach(true), 5000);
    return () => clearTimeout(t);
  }, []);

  function dismissOutreach() {
    setShowOutreach(false);
    localStorage.setItem("outreach_dismissed", "1");
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"'Cabinet Grotesk', sans-serif" }}>

      {/* ── Nav ── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:99, borderBottom:"1px solid var(--border)", background:"rgba(255,255,255,0.92)", backdropFilter:"blur(20px)" }}>
        <div style={{ maxWidth:1080, margin:"auto", padding:"0 24px", height:54, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span className="mono" style={{ fontSize:14, fontWeight:500, color:"var(--accent)", letterSpacing:"0.12em" }}>PROJEKKT</span>

          <div style={{ display:"flex", gap:8, alignItems:"center" }} className="desktop-nav">
            <a href="#how-it-works" style={{ fontSize:13, color:"var(--muted)", textDecoration:"none", padding:"6px 10px", borderRadius:8, transition:"color 0.15s" }}
              onMouseEnter={e => e.target.style.color = "var(--text)"}
              onMouseLeave={e => e.target.style.color = "var(--muted)"}>How it works</a>
            <a href="#pricing" style={{ fontSize:13, color:"var(--muted)", textDecoration:"none", padding:"6px 10px", borderRadius:8, transition:"color 0.15s" }}
              onMouseEnter={e => e.target.style.color = "var(--text)"}
              onMouseLeave={e => e.target.style.color = "var(--muted)"}>Pricing</a>
            <Link href="/login"    className="btn btn-outline" style={{ padding:"7px 16px", fontSize:13 }}>Log in</Link>
            <Link href="/register" className="btn btn-primary" style={{ padding:"7px 16px", fontSize:13 }}>Get started</Link>
          </div>

          <button onClick={() => setMenuOpen(o => !o)} className="mobile-menu-btn"
            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text)", fontSize:20, padding:4 }}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <div style={{ background:"var(--bg2)", borderTop:"1px solid var(--border)", padding:"16px 20px", display:"flex", flexDirection:"column", gap:14 }}>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} style={{ fontSize:15, color:"var(--muted)", textDecoration:"none" }}>How it works</a>
            <a href="#pricing"      onClick={() => setMenuOpen(false)} style={{ fontSize:15, color:"var(--muted)", textDecoration:"none" }}>Pricing</a>
            <div style={{ display:"flex", gap:10, paddingTop:4 }}>
              <Link href="/login"    className="btn btn-outline" style={{ flex:1, fontSize:14 }}>Log in</Link>
              <Link href="/register" className="btn btn-primary" style={{ flex:1, fontSize:14 }}>Get started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section style={{ paddingTop:"clamp(100px,14vw,130px)", paddingBottom:80, paddingLeft:24, paddingRight:24 }}>
        <div style={{ maxWidth:1080, margin:"auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center" }} className="hero-grid">

          {/* Left copy */}
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"5px 14px", border:"1px solid var(--border)", borderRadius:20, marginBottom:28 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", display:"inline-block", animation:"pulse 2s infinite" }} />
              <span className="mono" style={{ fontSize:11, color:"var(--muted)" }}>similarity review · editorial rewrite · tone matching</span>
            </div>

            <h1 style={{ fontSize:"clamp(36px,5.5vw,66px)", fontWeight:900, lineHeight:1.04, letterSpacing:"-0.03em", marginBottom:22 }}>
              Your document,<br />polished.<br />
              <span style={{ color:"var(--accent)" }}>Submit something<br />worth your name.</span>
            </h1>

            <p style={{ fontSize:"clamp(15px,1.8vw,18px)", color:"var(--text2)", maxWidth:480, lineHeight:1.7, marginBottom:36 }}>
              Upload your .docx. We review every section, identify anything that could raise questions, and rewrite it — so the whole document reads as consistently, naturally yours.
            </p>

            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:28 }}>
              <Link href="/register" className="btn btn-primary btn-lg">Start for free →</Link>
              <a href="#how-it-works" className="btn btn-outline btn-lg">See how it works</a>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>165,000+</span>
                <span style={{ fontSize:13, color:"var(--muted)" }}>documents processed</span>
              </div>
              <span style={{ color:"var(--border2)" }}>·</span>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <span style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>₦0.50</span>
                <span style={{ fontSize:13, color:"var(--muted)" }}>per word · credits never expire</span>
              </div>
            </div>
          </div>

          {/* Right: live drop-zone + scan widget */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
            <HeroScanner />
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section style={{ padding:"80px 24px", borderTop:"1px solid var(--border)" }}>
        <div style={{ maxWidth:1080, margin:"auto" }}>
          <p className="mono" style={{ fontSize:11, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14 }}>Who it's for</p>
          <h2 style={{ fontSize:"clamp(26px,4vw,42px)", fontWeight:900, letterSpacing:"-0.025em", marginBottom:40 }}>Built for anyone with a deadline.</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:14 }}>
            {AUDIENCES.map((a, i) => (
              <div key={i} style={{ padding:28, background:"var(--surface)", border:`1px solid ${i === 1 ? "rgba(92,59,255,0.2)" : "var(--border)"}`, borderRadius:14 }}>
                <div className="mono" style={{ fontSize:10, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>{a.tag}</div>
                <h3 style={{ fontSize:17, fontWeight:800, marginBottom:10, letterSpacing:"-0.02em" }}>{a.label}</h3>
                <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.7, marginBottom:18 }}>{a.body}</p>
                <Link href="/register" className="btn btn-primary" style={{ fontSize:13, padding:"8px 16px" }}>{a.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ padding:"80px 24px", borderTop:"1px solid var(--border)" }}>
        <div style={{ maxWidth:1080, margin:"auto" }}>
          <p className="mono" style={{ fontSize:11, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14 }}>How it works</p>
          <h2 style={{ fontSize:"clamp(26px,4vw,42px)", fontWeight:900, letterSpacing:"-0.025em", marginBottom:48 }}>Four steps. Clean document.</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
            {STEPS.map(s => (
              <div key={s.n} style={{ padding:24, background: s.highlight ? "rgba(92,59,255,0.02)" : "var(--surface)", border:`1px solid ${s.highlight ? "rgba(92,59,255,0.2)" : "var(--border)"}`, borderRadius:14, position:"relative", overflow:"hidden" }}>
                <span className="mono" style={{ fontSize:10, color:"rgba(92,59,255,0.5)", display:"block", marginBottom:12 }}>{s.n}</span>
                <h3 style={{ fontSize:15, fontWeight:800, marginBottom:8 }}>{s.title}</h3>
                <p style={{ fontSize:12, color:"var(--text2)", lineHeight:1.7 }}>{s.body}</p>
                <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:s.strength, borderRadius:"0 0 14px 14px" }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privacy ── */}
      <section style={{ padding:"80px 24px", borderTop:"1px solid var(--border)" }}>
        <div style={{ maxWidth:1080, margin:"auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }} className="privacy-grid">
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <div style={{ width:36, height:36, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <p className="mono" style={{ fontSize:11, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.12em" }}>Privacy</p>
            </div>
            <h2 style={{ fontSize:"clamp(26px,4vw,42px)", fontWeight:900, letterSpacing:"-0.025em", marginBottom:28 }}>Your document is private.</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                "Files are deleted from our servers 1 hour after processing.",
                "We never read, store, or sell your document content.",
                "Your personal details are never shared with third parties.",
              ].map((point, i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, fontSize:15, color:"var(--text2)", lineHeight:1.6 }}>
                  <span style={{ color:"var(--accent)", fontWeight:700, flexShrink:0, fontSize:17, marginTop:1 }}>✓</span>
                  {point}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"span 2", padding:22, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14 }}>
              <div className="mono" style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Auto-deleted in</div>
              <div style={{ fontSize:36, fontWeight:900, color:"var(--accent)", letterSpacing:"-0.03em" }}>1 hour</div>
              <div style={{ fontSize:13, color:"var(--text2)", marginTop:6 }}>Every file, automatically.</div>
            </div>
            <div style={{ padding:22, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14 }}>
              <div style={{ fontSize:28, fontWeight:900, letterSpacing:"-0.02em" }}>0</div>
              <div style={{ fontSize:12, color:"var(--text2)", marginTop:4 }}>Documents permanently stored</div>
            </div>
            <div style={{ padding:22, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14 }}>
              <div style={{ fontSize:28, fontWeight:900, letterSpacing:"-0.02em" }}>0</div>
              <div style={{ fontSize:12, color:"var(--text2)", marginTop:4 }}>Third parties with your data</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding:"80px 24px", borderTop:"1px solid var(--border)" }}>
        <div style={{ maxWidth:1080, margin:"auto" }}>
          <p className="mono" style={{ fontSize:11, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14 }}>Pricing</p>
          <h2 style={{ fontSize:"clamp(26px,4vw,42px)", fontWeight:900, letterSpacing:"-0.025em", marginBottom:12 }}>Buy credits. Use them anytime.</h2>
          <p style={{ fontSize:16, color:"var(--text2)", marginBottom:8 }}>₦0.50 per word. Credits never expire. Bigger bundles include free bonus credits.</p>
          <p style={{ fontSize:13, color:"var(--muted)", marginBottom:44 }}>A 2,000-word essay costs roughly 1,000 credits. A 10,000-word dissertation costs roughly 5,000 credits.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
            {BUNDLES.map(b => (
              <div key={b.id} style={{ padding:24, background: b.popular ? "rgba(92,59,255,0.03)" : "var(--surface)", border:`${b.popular ? "1.5px" : "1px"} solid ${b.popular ? "rgba(92,59,255,0.22)" : "var(--border)"}`, borderRadius:14, display:"flex", flexDirection:"column", gap:10, position:"relative" }}>
                {b.popular && <span className="badge badge-green" style={{ position:"absolute", top:14, right:14 }}>Popular</span>}
                <span className="mono" style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{b.label}</span>
                <div style={{ fontSize:28, fontWeight:900, letterSpacing:"-0.02em" }}>{b.price}</div>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:14, fontWeight:700, color:"var(--accent)" }}>{b.credits} credits</span>
                  {b.bonus && <span className="badge badge-gold" style={{ fontSize:9 }}>{b.bonus}</span>}
                </div>
                <p style={{ fontSize:12, color:"var(--muted)" }}>{b.desc}</p>
                <Link href="/register" className={`btn ${b.popular ? "btn-primary" : "btn-outline"}`} style={{ marginTop:"auto", width:"100%" }}>
                  Get {b.label}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding:"80px 24px", borderTop:"1px solid var(--border)" }}>
        <div style={{ maxWidth:680, margin:"auto" }}>
          <p className="mono" style={{ fontSize:11, color:"var(--accent)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14 }}>FAQ</p>
          <h2 style={{ fontSize:"clamp(26px,4vw,42px)", fontWeight:900, letterSpacing:"-0.025em", marginBottom:40 }}>Common questions.</h2>
          <div style={{ display:"flex", flexDirection:"column" }}>
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} isOpen={faqOpen === i} onToggle={() => setFaqOpen(faqOpen === i ? null : i)} />
            ))}
            <div style={{ borderTop:"1px solid var(--border)" }} />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding:"80px 24px", borderTop:"1px solid var(--border)", textAlign:"center" }}>
        <div style={{ maxWidth:560, margin:"auto" }}>
          <div style={{ width:64, height:64, border:"2px solid rgba(92,59,255,0.15)", borderRadius:"50%", margin:"0 auto 28px", display:"flex", alignItems:"center", justifyContent:"center", animation:"pkfloat1 5s ease-in-out infinite" }}>
            <div style={{ width:36, height:36, background:"var(--accent)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
          <h2 style={{ fontSize:"clamp(28px,5vw,52px)", fontWeight:900, letterSpacing:"-0.03em", marginBottom:16, lineHeight:1.1 }}>
            Submit something<br /><span style={{ color:"var(--accent)" }}>you're proud of.</span>
          </h2>
          <p style={{ fontSize:16, color:"var(--text2)", marginBottom:36, lineHeight:1.7 }}>
            Students, researchers, and professionals use Projekkt to make sure their work reads as their best — before it counts.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg">Get started — it's free to sign up</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop:"1px solid var(--border)", padding:"28px 24px" }}>
        <div style={{ maxWidth:1080, margin:"auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <span className="mono" style={{ fontSize:12, color:"var(--muted)" }}>
            PROJEKKT — by{" "}
            <a href="https://shaddies.space" style={{ color:"var(--accent)", textDecoration:"none" }}>Shaddies Space</a>
          </span>
          <div style={{ display:"flex", gap:20 }}>
            <Link href="/login"    style={{ fontSize:13, color:"var(--muted)", textDecoration:"none" }}>Log in</Link>
            <Link href="/register" style={{ fontSize:13, color:"var(--muted)", textDecoration:"none" }}>Sign up</Link>
          </div>
        </div>
      </footer>

      {/* ── Floating outreach button ── */}
      {showOutreach && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:200, display:"flex", alignItems:"center", gap:8, animation:"outreachFadeIn 0.5s ease forwards" }}>
          <a href="mailto:hello@shaddies.space" className="btn btn-primary"
            style={{ borderRadius:999, padding:"12px 22px", fontSize:14, boxShadow:"0 4px 24px rgba(92,59,255,0.28)" }}>
            Want someone to handle your project? Reach out →
          </a>
          <button onClick={dismissOutreach} aria-label="Dismiss"
            style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"50%", width:34, height:34, cursor:"pointer", color:"var(--muted)", fontSize:17, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            ×
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse          { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn         { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes outreachFadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pkfloat1       { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(5deg)} }
        @keyframes pkfloat2       { 0%,100%{transform:translateY(0) rotate(20deg)} 50%{transform:translateY(8px) rotate(28deg)} }

        .desktop-nav     { display: flex !important; }
        .mobile-menu-btn { display: none !important; }

        @media (max-width: 900px) {
          .hero-grid    { grid-template-columns: 1fr !important; }
          .privacy-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
        @media (max-width: 640px) {
          .desktop-nav     { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
}
