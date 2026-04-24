"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, getUser, clearToken, saveUser } from "@/lib/api";

const PROGRESS_MESSAGES = [
  { pct: 5,  msg: "Warming up the plagiarism radar…"              },
  { pct: 14, msg: "Cracking open your document…"                  },
  { pct: 22, msg: "Reading between the lines — literally…"        },
  { pct: 32, msg: "Hunting down suspicious paragraphs…"           },
  { pct: 43, msg: "Cross-referencing 250M academic papers…"       },
  { pct: 53, msg: "Interrogating the internet for matches…"       },
  { pct: 62, msg: "Running the Claude AI detection sweep…"        },
  { pct: 71, msg: "Flagged sections found. Rewriter inbound…"     },
  { pct: 80, msg: "DeepSeek is rewriting — this takes a moment…" },
  { pct: 88, msg: "Humanizing the rewrites…"                      },
  { pct: 94, msg: "Stitching your document back together…"        },
  { pct: 98, msg: "Final polish in progress…"                     },
];

const BUNDLES = [
  { id: "starter",  label: "Starter",  price: "₦2,000",  credits: 2000,  bonus: null,   desc: "Best for 1–2 documents" },
  { id: "standard", label: "Standard", price: "₦5,000",  credits: 5500,  bonus: "+500", desc: "Most flexible",          popular: true },
  { id: "pro",      label: "Pro",      price: "₦10,000", credits: 12000, bonus: "+2,000", desc: "Heavy users"           },
  { id: "studio",   label: "Studio",   price: "₦20,000", credits: 26000, bonus: "+6,000", desc: "Agencies & teams"      },
];

function Sidebar({ user, view, setView, reset, onLogout }) {
  const nav = [
    { id: "upload",  label: "Check Document" },
    { id: "credits", label: "Buy Credits"    },
    { id: "history", label: "History"        },
  ];
  const isUploadActive = ["upload","processing","done","quote"].includes(view);

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

      {/* Credit balance */}
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
              {n.label}
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

function DashboardInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const showCredits  = searchParams.get("showCredits") === "1";

  const [user, setUser]               = useState(null);
  const [view, setView]               = useState("upload");
  const [file, setFile]               = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [scanning, setScanning]       = useState(false);
  const [scanResult, setScanResult]   = useState(null);
  const [progress, setProgress]       = useState(0);
  const [progressMsg, setProgressMsg] = useState(PROGRESS_MESSAGES[0].msg);
  const [jobId, setJobId]             = useState(null);
  const [report, setReport]           = useState(null);
  const [error, setError]             = useState("");
  const [payLoading, setPayLoading]   = useState("");

  const fileInputRef  = useRef(null);
  const progressTimer = useRef(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    setUser(u);
    if (showCredits || (u.credits || 0) < 500) setView("credits");
  }, []);

  function startProgress() {
    let step = 0;
    setProgress(PROGRESS_MESSAGES[0].pct);
    setProgressMsg(PROGRESS_MESSAGES[0].msg);
    progressTimer.current = setInterval(() => {
      step++;
      if (step < PROGRESS_MESSAGES.length) {
        setProgress(PROGRESS_MESSAGES[step].pct);
        setProgressMsg(PROGRESS_MESSAGES[step].msg);
      }
    }, 14000);
  }

  function stopProgress() {
    clearInterval(progressTimer.current);
    setProgress(100);
    setProgressMsg("Done. Your document is ready.");
  }

  function handleFileSelect(f) {
    setError(""); setScanResult(null);
    if (!f) return;
    if (!f.name.endsWith(".docx")) { setError("Only .docx files are accepted."); return; }
    if (f.size > 10 * 1024 * 1024) { setError("File exceeds 10MB limit."); return; }
    setFile(f);
  }

  async function handleScan() {
    if (!file) return;
    setScanning(true); setError("");
    try {
      const data = await api.scanDocument(file);
      setScanResult(data);
    } catch (err) { setError(err.message); }
    finally { setScanning(false); }
  }

  async function handleUpload() {
    if (!file) return;
    setError(""); setView("processing"); startProgress();
    try {
      const data = await api.uploadDocument(file);
      stopProgress();
      // Deduct credits from local user state
      const updated = { ...user, credits: (user.credits || 0) - (data.credits_used || 0) };
      setUser(updated); saveUser(updated);
      setJobId(data.jobId); setReport(data.report); setView("done");
    } catch (err) {
      stopProgress(); setError(err.message); setView("upload");
    }
  }

  async function handleDownload() {
    try {
      const token = localStorage.getItem("projekkt_token");
      const res   = await fetch(api.getDownloadUrl(jobId), { headers: { Authorization: `Bearer ${token}` } });
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
      const data = await api.topupCredits(bundleId);
      window.location.href = data.paymentUrl;
    } catch (err) { setError(err.message); setPayLoading(""); }
  }

  function reset() { setFile(null); setJobId(null); setReport(null); setScanResult(null); setError(""); setProgress(0); setView("upload"); }
  function handleLogout() { clearToken(); router.push("/"); }

  if (!user) return null;

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
                  position: "relative",
                  display: "flex", flexDirection: "column", gap: 12,
                  transition: "border-color 0.15s, transform 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = b.popular ? "rgba(200,255,0,0.4)" : "var(--border2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = b.popular ? "rgba(200,255,0,0.22)" : "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  {b.popular && (
                    <span className="badge badge-green" style={{ position: "absolute", top: 16, right: 16 }}>Popular</span>
                  )}
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

            {/* Cost reference */}
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
                Upload a .docx. We scan it, show you the cost, then you confirm before any credits are spent.
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
                textAlign: "center", marginBottom: 16,
                transition: "all 0.15s",
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

            {!scanResult ? (
              <button className="btn btn-outline btn-lg" onClick={handleScan} disabled={!file || scanning || (user.credits || 0) < 500} style={{ width: "100%" }}>
                {scanning ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--border2)", borderTopColor: "var(--text)", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                    Scanning document…
                  </span>
                ) : "Scan document →"}
              </button>
            ) : (
              <div style={{ animation: "fadeUp 0.3s ease" }}>
                {/* Quote card */}
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20, marginBottom: 14 }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Document analysis</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { label: "Word count", value: `${scanResult.word_count.toLocaleString()} words` },
                      { label: "Tables", value: `${scanResult.table_count} table${scanResult.table_count !== 1 ? "s" : ""} — will be processed` },
                      ...(scanResult.image_count > 0 ? [{ label: "Images", value: `${scanResult.image_count} image${scanResult.image_count !== 1 ? "s" : ""} — not scanned`, warn: true }] : []),
                    ].map(row => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                        <span style={{ color: "var(--muted)" }}>{row.label}</span>
                        <span style={{ fontWeight: 600, color: row.warn ? "var(--warning)" : "var(--text)" }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700 }}>Credits required</span>
                      <span style={{ fontSize: 22, fontWeight: 900, color: "var(--accent)" }}>{scanResult.price.toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                      <span style={{ color: "var(--muted)" }}>Your balance</span>
                      <span style={{ color: (user.credits || 0) >= scanResult.price ? "var(--text2)" : "var(--danger)", fontWeight: 600 }}>
                        {(user.credits || 0).toLocaleString()} credits
                      </span>
                    </div>
                  </div>
                </div>

                {(user.credits || 0) < scanResult.price ? (
                  <div>
                    <p className="form-error" style={{ marginBottom: 12 }}>
                      ⚠ Insufficient credits. You need {(scanResult.price - (user.credits || 0)).toLocaleString()} more.
                    </p>
                    <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={() => setView("credits")}>
                      Top up credits →
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, padding: "9px 13px", background: "rgba(255,170,0,0.05)", border: "1px solid rgba(255,170,0,0.15)", borderRadius: 8 }}>
                      ⚠ <strong>{scanResult.price.toLocaleString()} credits</strong> will be deducted from your balance when processing starts. This cannot be undone.
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleUpload}>
                        Process document — {scanResult.price.toLocaleString()} credits
                      </button>
                      <button className="btn btn-ghost" onClick={() => { setFile(null); setScanResult(null); }}>Change</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PROCESSING VIEW ── */}
        {view === "processing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", animation: "fadeUp 0.35s ease" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: "3px solid var(--border2)", borderTopColor: "var(--accent)", animation: "spin 0.9s linear infinite", marginBottom: 32 }} />
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Analysing your document</h2>
            <p style={{ fontSize: 15, color: "var(--accent)", marginBottom: 28, fontWeight: 600 }}>{progressMsg}</p>
            <div style={{ width: "100%", maxWidth: 400, marginBottom: 10 }}>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{progress}%</span>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 28, maxWidth: 360, lineHeight: 1.6 }}>
              Keep this tab open. Processing time depends on document length — typically 2–5 minutes.
            </p>
          </div>
        )}

        {/* ── DONE VIEW ── */}
        {view === "done" && report && (
          <div style={{ animation: "fadeUp 0.35s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✓</div>
              <h1 style={{ fontSize: 28, fontWeight: 900 }}>Document ready</h1>
            </div>
            <p style={{ fontSize: 15, color: "var(--text2)", marginBottom: 28 }}>
              {report.paragraphs_paraphrased} paragraph{report.paragraphs_paraphrased !== 1 ? "s" : ""} rewritten
              {report.tables_cells_rewritten > 0 && `, ${report.tables_cells_rewritten} table cell${report.tables_cells_rewritten !== 1 ? "s" : ""} rewritten`}.
              Edited text is highlighted green in the file.
            </p>

            {/* Stats row */}
            <div className="stats-row" style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
              {[
                { val: report.total_paragraphs_checked,    label: "Checked"      },
                { val: report.paragraphs_paraphrased,      label: "Rewritten"    },
                { val: report.tables_cells_rewritten || 0, label: "Table cells"  },
                { val: report.references_skipped,           label: "Refs skipped" },
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
                        <span className={`badge ${item.action === "paraphrased" ? "badge-green" : ""}`}>{item.action === "paraphrased" ? "Rewritten" : "Skipped"}</span>
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
    <Suspense fallback={<div style={{ color: "var(--muted)", textAlign: "center", paddingTop: 80 }}>Loading…</div>}>
      <DashboardInner />
    </Suspense>
  );
}
