"use client";
import { Component, useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, getUser, clearToken, saveUser } from "@/lib/api";

// ── Scan stages shown while prescan runs ─────────────────────────────────────
const SCAN_STAGES = [
  { id: "open",      label: "Opening document",         detail: "Reading file structure and paragraphs…"           },
  { id: "ai",        label: "AI detection",             detail: "Checking for machine-generated patterns…"         },
  { id: "web",       label: "Web search",               detail: "Comparing against live web content…"              },
  { id: "academic",  label: "Academic databases",       detail: "Scanning published papers and journals…"          },
  { id: "internal",  label: "Internal similarity",      detail: "Checking for repeated passages within document…"  },
  { id: "calculate", label: "Calculating edit scope",   detail: "Counting words that need rewriting…"              },
];

// ── Process stages shown while document is being fixed ───────────────────────
const PROCESS_STAGES = [
  { id: "queue",     label: "Queued",                   detail: "Your document is in the processing queue…"        },
  { id: "rewrite",   label: "Rewriting flagged sections", detail: "Carefully rewriting each flagged paragraph…"    },
  { id: "tables",    label: "Processing tables",        detail: "Rewriting table cells where needed…"              },
  { id: "tone",      label: "Matching tone & flow",     detail: "Ensuring rewrites match your document's voice…"   },
  { id: "stitch",    label: "Rebuilding document",      detail: "Stitching everything back together…"              },
  { id: "review",    label: "Final review",             detail: "Running one last check before delivery…"          },
];

const BUNDLES = [
  { id: "starter",  label: "Starter",  price: "₦2,000",  credits: 2000,  bonus: null,     desc: "Best for a single assignment" },
  { id: "standard", label: "Standard", price: "₦5,000",  credits: 5500,  bonus: "+500",   desc: "Best value — save 10%", popular: true },
  { id: "pro",      label: "Pro",      price: "₦10,000", credits: 12000, bonus: "+2,000", desc: "Heavy users" },
  { id: "studio",   label: "Studio",   price: "₦20,000", credits: 26000, bonus: "+6,000", desc: "Agencies & teams" },
];

// ── Animated stage tracker component ─────────────────────────────────────────
function StageTracker({ stages, activeIndex, title, subtitle }) {
  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, textAlign: "center" }}>{title}</h2>
      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 32, textAlign: "center", lineHeight: 1.5 }}>{subtitle}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {stages.map((stage, i) => {
          const done    = i < activeIndex;
          const active  = i === activeIndex;
          const pending = i > activeIndex;

          return (
            <div key={stage.id} style={{ display: "flex", gap: 16, alignItems: "flex-start", position: "relative" }}>
              {/* Connector line */}
              {i < stages.length - 1 && (
                <div style={{
                  position: "absolute", left: 15, top: 32, width: 2, height: "calc(100% - 8px)",
                  background: done ? "rgba(200,255,0,0.4)" : "var(--border)",
                  transition: "background 0.5s ease",
                }} />
              )}

              {/* Icon */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, zIndex: 1,
                background: done    ? "rgba(200,255,0,0.15)"  :
                            active  ? "rgba(200,255,0,0.08)"  : "var(--surface)",
                border: done    ? "1.5px solid rgba(200,255,0,0.5)"  :
                        active  ? "1.5px solid rgba(200,255,0,0.8)"  : "1.5px solid var(--border)",
                color: done ? "var(--accent)" : active ? "var(--accent)" : "var(--muted)",
                boxShadow: active ? "0 0 12px rgba(200,255,0,0.2)" : "none",
                transition: "all 0.4s ease",
              }}>
                {done ? "✓" : active ? (
                  <span style={{
                    width: 10, height: 10, borderRadius: "50%",
                    border: "2px solid var(--border2)", borderTopColor: "var(--accent)",
                    animation: "spin 0.8s linear infinite", display: "inline-block",
                  }} />
                ) : (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--border2)", display: "inline-block" }} />
                )}
              </div>

              {/* Text */}
              <div style={{ paddingBottom: 24, flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: active ? 700 : done ? 600 : 400,
                  color: pending ? "var(--muted)" : "var(--text)",
                  transition: "all 0.3s",
                }}>{stage.label}</div>
                {active && (
                  <div style={{
                    fontSize: 12, color: "var(--accent)", marginTop: 2, lineHeight: 1.4,
                    animation: "fadeUp 0.3s ease",
                  }}>{stage.detail}</div>
                )}
                {done && (
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Complete</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Live scanning screen (replaces fake stage ticker) ────────────────────────
function ScanningScreen({ filename, startTime }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  // Progress fills to ~80% over 40s, then crawls to 92% max — never lies by hitting 100
  const progress = elapsed <= 40
    ? (elapsed / 40) * 80
    : 80 + Math.min(12, ((elapsed - 40) / 60) * 12);

  const mins   = Math.floor(elapsed / 60);
  const secs   = elapsed % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  const CHECKS = ["AI Detection", "Web Search", "Academic DB", "Similarity"];

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "72vh", padding: "40px 20px",
      animation: "fadeUp 0.35s ease",
    }}>

      {/* Pulsing radar rings */}
      <div style={{ position: "relative", width: 110, height: 110, marginBottom: 36, flexShrink: 0 }}>
        <div style={{
          position: "absolute", inset: -22, borderRadius: "50%",
          border: "1px solid rgba(200,255,0,0.12)",
          animation: "scanPing 2.2s ease-out infinite",
        }} />
        <div style={{
          position: "absolute", inset: -11, borderRadius: "50%",
          border: "1px solid rgba(200,255,0,0.18)",
          animation: "scanPing 2.2s ease-out infinite 0.55s",
        }} />
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%",
          background: "rgba(200,255,0,0.05)",
          border: "1.5px solid rgba(200,255,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 34,
        }}>
          📄
        </div>
      </div>

      {/* Elapsed time — the honest clock */}
      <div style={{
        fontSize: 52, fontWeight: 900,
        fontFamily: "'DM Mono',monospace",
        color: "var(--accent)", letterSpacing: "-0.03em",
        lineHeight: 1, marginBottom: 6,
      }}>
        {timeStr}
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono',monospace" }}>
        scanning
      </div>

      {/* Filename pill */}
      {filename && (
        <div style={{
          fontSize: 13, color: "var(--text2)", fontWeight: 600,
          marginBottom: 28, padding: "6px 14px",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 8, maxWidth: 320,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {filename}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 420, marginBottom: 28 }}>
        <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "linear-gradient(90deg, rgba(200,255,0,0.6), rgba(200,255,0,1))",
            borderRadius: 2, transition: "width 1s linear",
          }} />
        </div>
      </div>

      {/* Active check pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
        {CHECKS.map(check => (
          <div key={check} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "6px 13px",
            background: "var(--surface)",
            border: "1px solid rgba(200,255,0,0.15)",
            borderRadius: 20, fontSize: 12, color: "var(--text2)",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--accent)", display: "inline-block",
              animation: "scanPulse 1.6s ease-in-out infinite",
            }} />
            {check}
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>
        Keep this tab open — your results appear here automatically.
      </p>
    </div>
  );
}


function Sidebar({ user, view, setView, reset, onLogout }) {
  const nav = [
    { id: "upload",  icon: "📄", label: "Check Document" },
    { id: "credits", icon: "💳", label: "Buy Credits"    },
    { id: "history", icon: "🕓", label: "History"        },
  ];
  const isUploadActive = ["upload", "scanning", "processing", "done", "quote"].includes(view);

  return (
    <aside className="dashboard-sidebar" style={{
      width: 220, flexShrink: 0,
      background: "var(--bg2)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      padding: "24px 12px",
      position: "sticky", top: 0, height: "100vh",
    }}>
      <Link href="/" style={{ textDecoration: "none", padding: "0 8px", marginBottom: 32, display: "block" }}>
        <span className="mono" style={{ fontSize: 14, fontWeight: 500, color: "var(--accent)", letterSpacing: "0.12em" }}>PROJEKKT</span>
      </Link>

      <div className="dashboard-sidebar-credits" style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: "var(--radius)", marginBottom: 24, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Credits</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "var(--accent)", letterSpacing: "-0.02em" }}>
          {(user?.credits || 0).toLocaleString()}
        </div>
        {(user?.credits || 0) < 500 && (
          <div style={{ fontSize: 11, color: "var(--warning)", marginTop: 4 }}>⚠ Low balance</div>
        )}
      </div>

      <nav className="dashboard-sidebar-nav" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map(n => {
          const active = n.id === "upload" ? isUploadActive : view === n.id;
          return (
            <button key={n.id}
              onClick={() => { if (n.id === "upload") reset(); else setView(n.id); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8,
                background: active ? "var(--accent-dim)" : "transparent",
                border: active ? "1px solid rgba(200,255,0,0.2)" : "1px solid transparent",
                cursor: "pointer", color: active ? "var(--accent)" : "var(--muted)",
                fontSize: 14, fontWeight: active ? 700 : 500,
                fontFamily: "'Cabinet Grotesk',sans-serif",
                textAlign: "left", width: "100%", transition: "all 0.15s",
              }}>
              {n.icon} <span className="mobile-nav-label">{n.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "var(--surface2)", border: "1px solid var(--border2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "var(--accent)", flexShrink: 0,
        }}>
          {user?.email?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text2)" }}>
            {user?.email?.split("@")[0]}
          </div>
        </div>
        <button onClick={onLogout} title="Log out"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14, padding: 4, flexShrink: 0, transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--muted)"}>
          ↪
        </button>
      </div>
    </aside>
  );
}

// ── Error boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error("[Dashboard]", err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)", gap: 16, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 32 }}>⚠</div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong.</h2>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Please refresh the page to continue.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Refresh page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Main dashboard ────────────────────────────────────────────────────────────
function DashboardInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const showCredits  = searchParams.get("showCredits") === "1";

  const [user, setUser]               = useState(null);
  const [view, setView]               = useState("upload");
  const [file, setFile]               = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [scanResult, setScanResult]   = useState(null);
  const [scanStartTime, setScanStartTime] = useState(null);
  const [scanStage, setScanStage]     = useState(0);
  const [procStage, setProcStage]     = useState(0);
  const [jobId, setJobId]             = useState(null);
  const [report, setReport]           = useState(null);
  const [error, setError]             = useState("");
  const [payLoading, setPayLoading]   = useState("");

  const fileInputRef = useRef(null);
  const scanPollRef  = useRef(null);
  const procPollRef  = useRef(null);
  const stageTimers  = useRef([]);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    setUser(u);
    if (showCredits || (u.credits || 0) < 500) setView("credits");

    // Refresh credits from server in the background
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) { saveUser({ ...u, ...data.user }); setUser(prev => ({ ...prev, ...data.user })); }
      })
      .catch(() => {});

    return () => _clearAll();
  }, []);

  function _clearAll() {
    clearInterval(scanPollRef.current);
    clearInterval(procPollRef.current);
    stageTimers.current.forEach(clearTimeout);
    stageTimers.current = [];
  }

  // Advance scan stages on a timer to look alive while polling
  function _animateScanStages() {
    setScanStage(0);
    SCAN_STAGES.forEach((_, i) => {
      if (i === 0) return;
      const t = setTimeout(() => setScanStage(i), i * 7000);
      stageTimers.current.push(t);
    });
  }

  function _animateProcStages() {
    setProcStage(0);
    PROCESS_STAGES.forEach((_, i) => {
      if (i === 0) return;
      const t = setTimeout(() => setProcStage(i), i * 22000);
      stageTimers.current.push(t);
    });
  }

  async function handleScan() {
    if (!file) return;
    setError(""); setView("scanning"); setScanStartTime(Date.now());

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/document/scan", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed.");

      const { scanJobId } = data;

      // Poll scan-status
      scanPollRef.current = setInterval(async () => {
        try {
          const r    = await fetch(`/api/document/scan-status?scanJobId=${encodeURIComponent(scanJobId)}`, { credentials: "include" });
          const poll = await r.json();
          if (poll.status === "done") {
            clearInterval(scanPollRef.current);
            stageTimers.current.forEach(clearTimeout);
            setScanStage(SCAN_STAGES.length); // all complete
            setScanResult(poll.result);
            setView("upload"); // go back to upload view to show quote
          } else if (poll.status === "failed") {
            clearInterval(scanPollRef.current);
            stageTimers.current.forEach(clearTimeout);
            setError("Scan failed. Please try again.");
            setView("upload");
          }
        } catch { /* network hiccup — keep polling */ }
      }, 3500);

    } catch (err) {
      clearInterval(scanPollRef.current);
      stageTimers.current.forEach(clearTimeout);
      setError(err.message);
      setView("upload");
    }
  }

  async function handleUpload() {
    if (!file) return;
    setError(""); setView("processing"); setProcStage(0);
    _animateProcStages();

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/document/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");

      setJobId(data.jobId);

      procPollRef.current = setInterval(async () => {
        try {
          const r    = await fetch(`/api/document/status?jobId=${encodeURIComponent(data.jobId)}`, { credentials: "include" });
          const poll = await r.json();
          if (poll.status === "done") {
            clearInterval(procPollRef.current);
            stageTimers.current.forEach(clearTimeout);
            setProcStage(PROCESS_STAGES.length);
            // Refresh user from auth so credits are accurate (deducted server-side)
            const meRes = await fetch("/api/auth/me", { credentials: "include" }).catch(() => null);
            if (meRes?.ok) {
              const meData = await meRes.json().catch(() => null);
              if (meData?.user) { saveUser(meData.user); setUser(meData.user); }
            }
            setReport(poll.report); setView("done");
          } else if (poll.status === "failed") {
            clearInterval(procPollRef.current);
            stageTimers.current.forEach(clearTimeout);
            setError(poll.fail_reason === "insufficient_credits"
              ? "Insufficient credits. Please top up and try again."
              : "Processing failed. Please try again.");
            setView("upload");
          }
        } catch { /* keep polling */ }
      }, 5000);

    } catch (err) {
      _clearAll();
      setError(err.message); setView("upload");
    }
  }

  async function handleDownload() {
    try {
      const res = await fetch(`/api/document/download?jobId=${jobId}`, { credentials: "include" });
      if (!res.ok) { setError("Download failed. File may have expired."); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "corrected_document.docx"; a.click();
      URL.revokeObjectURL(url);
    } catch { setError("Download failed."); }
  }

  async function handleTopup(bundleId) {
    setPayLoading(bundleId); setError("");
    try {
      const res  = await fetch("/api/credits/topup", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bundle: bundleId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed.");
      window.location.href = data.paymentUrl;
    } catch (err) { setError(err.message); setPayLoading(""); }
  }

  function handleFileSelect(f) {
    setError(""); setScanResult(null);
    if (!f) return;
    if (!f.name.endsWith(".docx")) { setError("Only .docx files are accepted."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("File exceeds 10MB limit."); return; }
    setFile(f);
  }

  function reset() {
    _clearAll();
    setFile(null); setJobId(null); setReport(null); setScanResult(null);
    setError(""); setScanStage(0); setProcStage(0); setScanStartTime(null); setView("upload");
  }

  function handleLogout() { clearToken(); router.push("/"); }

  if (!user) return null;

  const scanData = scanResult;

  return (
    <div className="dashboard-layout" style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar user={user} view={view} setView={setView} reset={reset} onLogout={handleLogout} />

      <main className="dashboard-main" style={{ flex: 1, padding: "40px 48px", overflowY: "auto", maxWidth: 780 }}>

        {/* ── CREDITS VIEW ── */}
        {view === "credits" && (
          <div style={{ animation: "fadeUp 0.35s ease" }}>
            <div style={{ marginBottom: 36 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Buy credits</h1>
              <p style={{ fontSize: 15, color: "var(--text2)" }}>
                Credits are deducted per document at <strong style={{ color: "var(--text)" }}>₦0.50 per word</strong>. They never expire.
              </p>
            </div>

            {error && <p className="form-error" style={{ marginBottom: 20 }}>⚠ {error}</p>}

            <div className="credits-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 32 }}>
              {BUNDLES.map(b => (
                <div key={b.id} style={{
                  padding: 24,
                  background: b.popular ? "rgba(200,255,0,0.04)" : "var(--surface)",
                  border: `1px solid ${b.popular ? "rgba(200,255,0,0.22)" : "var(--border)"}`,
                  borderRadius: "var(--radius-lg)",
                  position: "relative", display: "flex", flexDirection: "column", gap: 12,
                  transition: "border-color 0.15s, transform 0.15s", cursor: "pointer",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = b.popular ? "rgba(200,255,0,0.4)" : "var(--border2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = b.popular ? "rgba(200,255,0,0.22)" : "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  {b.popular && <span className="badge badge-green" style={{ position: "absolute", top: 16, right: 16 }}>Popular</span>}
                  <div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{b.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" }}>{b.price}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--accent)" }}>{b.credits.toLocaleString()} credits</span>
                    {b.bonus && <span className="badge badge-gold">{b.bonus} free</span>}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--muted)" }}>{b.desc}</p>
                  <button className={`btn ${b.popular ? "btn-primary" : "btn-outline"}`}
                    style={{ width: "100%", marginTop: 4 }}
                    onClick={() => handleTopup(b.id)} disabled={!!payLoading}>
                    {payLoading === b.id ? "Redirecting…" : `Buy ${b.label}`}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ padding: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 13 }}>
              <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Credit cost guide</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { size: "~1,000 words", cost: "500 credits" },
                  { size: "~3,000 words", cost: "1,500 credits" },
                  { size: "~5,000 words", cost: "2,500 credits" },
                  { size: "~8,000 words", cost: "4,000 credits" },
                  { size: "~12,000 words", cost: "6,000 credits" },
                  { size: "~20,000 words", cost: "10,000 credits" },
                ].map(r => (
                  <div key={r.size} style={{ padding: "10px 14px", background: "var(--bg2)", borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{r.size}</div>
                    <div style={{ color: "var(--muted)" }}>{r.cost}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── UPLOAD VIEW ── */}
        {view === "upload" && (
          <div style={{ animation: "fadeUp 0.35s ease" }}>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>Check a document</h1>
              <p style={{ fontSize: 15, color: "var(--text2)" }}>
                Upload your .docx. We preview the editing cost first — you only confirm when you are ready.
              </p>
            </div>

            {error && <p className="form-error" style={{ marginBottom: 20 }}>⚠ {error}</p>}

            {(user.credits || 0) < 500 && (
              <div style={{ padding: "12px 16px", background: "rgba(255,170,0,0.07)", border: "1px solid rgba(255,170,0,0.2)", borderRadius: "var(--radius)", marginBottom: 20, fontSize: 14 }}>
                ⚠ You need at least 500 credits to process a document.{" "}
                <button onClick={() => setView("credits")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--warning)", fontWeight: 700, textDecoration: "underline", fontSize: 14 }}>
                  Buy credits →
                </button>
              </div>
            )}

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
              style={{
                border: `2px dashed ${dragOver ? "rgba(200,255,0,0.7)" : file ? "rgba(200,255,0,0.4)" : "var(--border2)"}`,
                borderRadius: "var(--radius-lg)", padding: "40px 24px",
                cursor: "pointer", background: dragOver ? "rgba(200,255,0,0.03)" : "var(--surface)",
                textAlign: "center", marginBottom: 16, transition: "all 0.15s",
              }}>
              <input ref={fileInputRef} type="file" accept=".docx" style={{ display: "none" }} onChange={e => handleFileSelect(e.target.files[0])} />
              {file ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📄</div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{file.name}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{(file.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setFile(null); setScanResult(null); }}
                    style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18, padding: 4 }}>✕</button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⬆</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Drop your .docx here</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>or click to browse — max 10MB</div>
                  <div className="touch-upload-hint" style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>or tap to select file</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 14 }}>
                    <span className="badge badge-green">Tables processed</span>
                    <span className="badge badge-blue">Images skipped</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quote or scan button */}
            {!scanData ? (
              <button className="btn btn-outline btn-lg" onClick={handleScan} disabled={!file} style={{ width: "100%" }}>
                Scan document →
              </button>
            ) : (
              <div style={{ animation: "fadeUp 0.3s ease" }}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 14 }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Document analysis</div>

                  {/* Verdict badge */}
                  <div style={{ marginBottom: 16 }}>
                    {scanData.verdict === "clean" ? (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.25)", borderRadius: 8 }}>
                        <span style={{ color: "var(--accent)", fontSize: 16 }}>✓</span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--accent)" }}>Document looks clean</span>
                      </div>
                    ) : (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(255,100,50,0.06)", border: "1px solid rgba(255,100,50,0.2)", borderRadius: 8 }}>
                        <span style={{ fontSize: 16 }}>⚠</span>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>Issues found</span>
                      </div>
                    )}
                  </div>

                  {/* Issue breakdown */}
                  {scanData.issueLines?.length > 0 && (
                    <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                      {scanData.issueLines.map((line, i) => (
                        <div key={i} style={{ fontSize: 13, color: "var(--text2)", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: "var(--warning)", fontSize: 11 }}>●</span> {line}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cost line */}
                  {scanData.costLine && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700 }}>Editing cost</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>
                        {(scanData.costLine.split("—")[1] ?? scanData.costLine).trim()}
                      </span>
                    </div>
                  )}

                  {scanData._internal?.credits_needed > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginTop: 8 }}>
                      <span style={{ color: "var(--muted)" }}>Your balance</span>
                      <span style={{ color: (user.credits || 0) >= scanData._internal.credits_needed ? "var(--text2)" : "var(--danger)", fontWeight: 600 }}>
                        {(user.credits || 0).toLocaleString()} credits
                      </span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {scanData.verdict === "clean" || scanData._internal?.credits_needed === 0 ? (
                  <div>
                    <p style={{ fontSize: 12, color: "var(--accent)", marginBottom: 12, padding: "9px 13px", background: "rgba(200,255,0,0.06)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: 8 }}>
                      🎉 This document fits within your free allowance — no credits needed.
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleUpload}>Process document — Free</button>
                      <button className="btn btn-ghost" onClick={() => { setFile(null); setScanResult(null); }}>Change</button>
                    </div>
                  </div>
                ) : (user.credits || 0) < (scanData._internal?.credits_needed || 0) ? (
                  <div>
                    <p className="form-error" style={{ marginBottom: 12 }}>
                      ⚠ Insufficient credits. You need {((scanData._internal.credits_needed || 0) - (user.credits || 0)).toLocaleString()} more.
                    </p>
                    <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={() => setView("credits")}>
                      Top up credits →
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, padding: "9px 13px", background: "rgba(255,170,0,0.05)", border: "1px solid rgba(255,170,0,0.15)", borderRadius: 8 }}>
                      ⚠ <strong>{(scanData._internal?.credits_needed || 0).toLocaleString()} credits</strong> will be used when editing starts. This cannot be undone.
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleUpload}>
                        Process document — {(scanData._internal?.credits_needed || 0).toLocaleString()} credits
                      </button>
                      <button className="btn btn-ghost" onClick={() => { setFile(null); setScanResult(null); }}>Change</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SCANNING VIEW ── */}
        {view === "scanning" && (
          <ScanningScreen filename={file?.name} startTime={scanStartTime} />
        )}

        {/* ── PROCESSING VIEW ── */}
        {view === "processing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", animation: "fadeUp 0.35s ease" }}>
            <StageTracker
              stages={PROCESS_STAGES}
              activeIndex={Math.min(procStage, PROCESS_STAGES.length - 1)}
              title="Fixing your document"
              subtitle="Our editor is rewriting every flagged section. Longer documents take 3–6 minutes."
            />
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 36, textAlign: "center" }}>
              Keep this tab open — your download will appear here automatically.
            </p>
          </div>
        )}

        {/* ── DONE VIEW ── */}
        {view === "done" && report && (
          <div style={{ animation: "fadeUp 0.35s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✓</div>
              <h1 style={{ fontSize: 28, fontWeight: 900 }}>Your document is ready.</h1>
            </div>
            <p style={{ fontSize: 15, color: "var(--text2)", marginBottom: 28 }}>
              {report.paragraphs_paraphrased} section{report.paragraphs_paraphrased !== 1 ? "s" : ""} were edited
              {report.tables_cells_rewritten > 0 && `, ${report.tables_cells_rewritten} table cell${report.tables_cells_rewritten !== 1 ? "s" : ""} rewritten`}.
              Changes are highlighted green in the downloaded file — review everything before you submit.
            </p>

            <div className="stats-row" style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
              {[
                { val: report.total_paragraphs_checked,    label: "Checked"      },
                { val: report.paragraphs_paraphrased,      label: "Rewritten"    },
                { val: report.tables_cells_rewritten || 0, label: "Table cells"  },
                { val: report.references_skipped,          label: "Refs skipped" },
              ].map(s => (
                <div key={s.label} style={{ padding: "14px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", minWidth: 90, flex: 1 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "var(--accent)", letterSpacing: "-0.02em" }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              <button className="btn btn-primary btn-lg" onClick={handleDownload}>⬇ Download Corrected Document</button>
              <button className="btn btn-outline" onClick={reset}>Check Another</button>
            </div>

            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 32, padding: "9px 13px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
              ⏱ File auto-deletes in 1 hour for your privacy.
            </p>

            {report.items?.length > 0 && (
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "var(--text2)" }}>What changed</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {report.items.map((item, i) => (
                    <div key={i} style={{ padding: "14px 18px", background: "var(--surface)", border: `1px solid ${item.action === "skipped" ? "var(--border)" : "rgba(200,255,0,0.1)"}`, borderRadius: "var(--radius)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>¶{item.paragraph}</span>
                        <span className={`badge ${item.action === "paraphrased" ? "badge-green" : ""}`}>{item.action === "paraphrased" ? "Rewritten" : "No changes needed"}</span>
                      </div>
                      {item.preview && <p style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic", marginBottom: 6, lineHeight: 1.5 }}>"{item.preview}"</p>}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {item.flags.map((f, j) => (
                          <span key={j} style={{ fontSize: 11, color: "var(--text2)", background: "var(--surface2)", padding: "2px 8px", borderRadius: 4, border: "1px solid var(--border)" }}>⚠ {f}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY VIEW ── */}
        {view === "history" && (
          <div style={{ animation: "fadeUp 0.35s ease" }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>History</h1>
            <p style={{ fontSize: 15, color: "var(--text2)", marginBottom: 32 }}>Your recent document jobs and credit transactions.</p>
            <div style={{ padding: 40, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>History coming soon.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ color: "var(--muted)", textAlign: "center", paddingTop: 80 }}>Loading…</div>}>
        <DashboardInner />
      </Suspense>
      <style>{`
        @media (max-width: 768px) { .mobile-nav-label { display: none; } }
        @keyframes scanPing {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        @keyframes scanPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
      `}</style>
    </ErrorBoundary>
  );
}
