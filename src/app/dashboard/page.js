"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, getUser, clearToken, saveUser } from "@/lib/api";

const PROGRESS_MESSAGES = [
  { pct: 5,  msg: "Warming up the plagiarism radar…" },
  { pct: 12, msg: "Cracking open your document…" },
  { pct: 20, msg: "Reading between the lines — literally…" },
  { pct: 30, msg: "Hunting down suspicious paragraphs…" },
  { pct: 42, msg: "Cross-referencing 250 million academic papers…" },
  { pct: 52, msg: "Interrogating the internet for matches…" },
  { pct: 60, msg: "Running the AI detection sweep…" },
  { pct: 70, msg: "Flagged sections identified. Calling in the rewriter…" },
  { pct: 78, msg: "DeepSeek is doing its thing — this takes a moment…" },
  { pct: 86, msg: "Humanizing the rewrites. Making it sound like you…" },
  { pct: 93, msg: "Stitching your document back together…" },
  { pct: 98, msg: "Almost there. Final polish in progress…" },
];

const FIXED_PLANS = [
  { id: "weekly",  label: "Weekly Unlimited",  price: "₦7,000",  desc: "Unlimited documents for 7 days.",  popular: true  },
  { id: "monthly", label: "Monthly Unlimited", price: "₦20,000", desc: "Unlimited documents for 30 days.", popular: false },
];

function DashboardInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const showPlans    = searchParams.get("showPlans") === "1";

  const [user, setUser]               = useState(null);
  const [view, setView]               = useState("upload");
  const [file, setFile]               = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [scanning, setScanning]       = useState(false);
  const [scanResult, setScanResult]   = useState(null); // { word_count, table_count, image_count, price }
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
    setView(showPlans || !u.isPaid ? "plans" : "upload");
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
    setProgressMsg("Your document is ready. 🎉");
  }

  function handleFileSelect(selected) {
    setError("");
    setScanResult(null);
    if (!selected) return;
    if (!selected.name.endsWith(".docx")) { setError("Only .docx files are accepted."); return; }
    if (selected.size > 10 * 1024 * 1024) { setError("File is too large. Maximum size is 10MB."); return; }
    setFile(selected);
  }

  async function handleScan() {
    if (!file) return;
    setScanning(true);
    setError("");
    try {
      const token = localStorage.getItem("projekkt_token");
      const fd    = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/document/scan", {
        method: "POST", body: fd,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed.");
      setScanResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }

  async function handleUpload() {
    if (!file) return;
    setError("");
    setView("processing");
    startProgress();
    try {
      const data = await api.uploadDocument(file);
      stopProgress();
      setJobId(data.jobId);
      setReport(data.report);
      setView("done");
    } catch (err) {
      stopProgress();
      setError(err.message);
      setView("upload");
    }
  }

  async function handleDownload() {
    try {
      const token = localStorage.getItem("projekkt_token");
      const res   = await fetch(api.getDownloadUrl(jobId), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setError("Download failed. The file may have expired."); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "corrected_document.docx"; a.click();
      URL.revokeObjectURL(url);
    } catch { setError("Download failed."); }
  }

  async function handlePay(planId, amount) {
    setPayLoading(planId);
    setError("");
    try {
      const token = localStorage.getItem("projekkt_token");
      const res   = await fetch("/api/payment/initiate", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ plan: planId, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed.");
      window.location.href = data.paymentUrl;
    } catch (err) {
      setError(err.message);
      setPayLoading("");
    }
  }

  function handleLogout() { clearToken(); router.push("/"); }
  function reset() { setFile(null); setJobId(null); setReport(null); setScanResult(null); setError(""); setProgress(0); setView("upload"); }

  if (!user) return null;

  const NAV = [
    { id: "upload", label: "Check Document", icon: "◈" },
    { id: "plans",  label: "Plans",          icon: "◇" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 240, flexShrink: 0, background: "var(--bg2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "28px 16px", position: "sticky", top: 0, height: "100vh" }}>
        <Link href="/" style={{ textDecoration: "none", marginBottom: 40, display: "block", paddingLeft: 10 }}>
          <span className="mono" style={{ fontSize: 15, fontWeight: 500, color: "var(--accent)", letterSpacing: "0.1em" }}>PROJEKKT</span>
        </Link>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map(n => (
            <button key={n.id}
              onClick={() => { if (n.id === "upload" && user.isPaid) reset(); else setView(n.id); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 8,
                background: (view === n.id || (n.id === "upload" && ["processing","done","quote"].includes(view))) ? "rgba(200,255,0,0.07)" : "transparent",
                border: "none", cursor: "pointer",
                color: (view === n.id || (n.id === "upload" && ["processing","done","quote"].includes(view))) ? "var(--accent)" : "var(--muted)",
                fontSize: 14, fontWeight: 500, fontFamily: "'Sora',sans-serif", textAlign: "left", width: "100%",
              }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email?.split("@")[0]}</div>
            <span className={`badge ${user.isPaid ? "badge-green" : "badge-blue"}`} style={{ fontSize: 10 }}>{user.isPaid ? user.planType : "no plan"}</span>
          </div>
          <button onClick={handleLogout} title="Log out" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16, padding: 4, flexShrink: 0 }}>↪</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "48px 40px", maxWidth: 720, overflowY: "auto" }}>

        {/* PLANS */}
        {view === "plans" && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>Choose a plan</h1>
            <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 36 }}>
              Upload a document to get a per-doc price, or go unlimited with a weekly or monthly plan.
            </p>
            {error && <p className="form-error" style={{ marginBottom: 20 }}>⚠ {error}</p>}

            {/* Per-doc — upload to get quote */}
            <div style={{ padding: 24, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 16 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Per Document</span>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>₦0.50 per word</div>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Upload your document first — we scan it and show you the exact price before you pay.</p>

              {!scanResult ? (
                <div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
                    style={{ border: `2px dashed ${dragOver ? "rgba(200,255,0,0.6)" : file ? "rgba(200,255,0,0.35)" : "var(--border)"}`, borderRadius: 8, padding: 24, cursor: "pointer", textAlign: "center", marginBottom: 12 }}>
                    <input ref={fileInputRef} type="file" accept=".docx" style={{ display: "none" }} onChange={e => handleFileSelect(e.target.files[0])} />
                    {file ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                        <span>📄</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{file.name}</span>
                        <button onClick={e => { e.stopPropagation(); setFile(null); setScanResult(null); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>✕</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>Drop your .docx here or click to browse</span>
                    )}
                  </div>
                  <button className="btn btn-outline" onClick={handleScan} disabled={!file || scanning} style={{ width: "100%" }}>
                    {scanning ? "Scanning…" : "Scan document for price →"}
                  </button>
                </div>
              ) : (
                <div>
                  {/* Quote card */}
                  <div style={{ background: "var(--bg2)", borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "var(--muted)" }}>Word count</span>
                      <span style={{ fontWeight: 600 }}>{scanResult.word_count.toLocaleString()} words</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "var(--muted)" }}>Tables detected</span>
                      <span style={{ fontWeight: 600 }}>{scanResult.table_count} {scanResult.table_count === 1 ? "table" : "tables"} — will be processed</span>
                    </div>
                    {scanResult.image_count > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ color: "var(--muted)" }}>Images detected</span>
                        <span style={{ color: "#f59e0b", fontWeight: 600 }}>⚠ {scanResult.image_count} image{scanResult.image_count !== 1 ? "s" : ""} — not scanned</span>
                      </div>
                    )}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--muted)" }}>Your price</span>
                      <span style={{ fontWeight: 800, fontSize: 16, color: "var(--accent)" }}>₦{scanResult.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, padding: "8px 12px", background: "rgba(255,165,0,0.06)", border: "1px solid rgba(255,165,0,0.15)", borderRadius: 6 }}>
                    ⚠ You will be charged exactly <strong>₦{scanResult.price.toLocaleString()}</strong>. Do not modify the amount on the payment page. Underpayments will not be accepted and access will not be granted.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }}
                      onClick={() => handlePay("per_doc", scanResult.price)} disabled={!!payLoading}>
                      {payLoading === "per_doc" ? "Redirecting…" : `Pay ₦${scanResult.price.toLocaleString()} →`}
                    </button>
                    <button className="btn btn-outline" onClick={() => { setFile(null); setScanResult(null); }}>Change file</button>
                  </div>
                </div>
              )}
            </div>

            {/* Weekly + Monthly */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {FIXED_PLANS.map(p => (
                <div key={p.id} style={{ padding: 24, background: p.popular ? "rgba(200,255,0,0.04)" : "var(--surface)", border: `1px solid ${p.popular ? "rgba(200,255,0,0.25)" : "var(--border)"}`, borderRadius: 12, position: "relative", display: "flex", flexDirection: "column", gap: 12 }}>
                  {p.popular && <span className="mono badge badge-green" style={{ position: "absolute", top: 14, right: 14, fontSize: 9 }}>Popular</span>}
                  <span className="mono" style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.label}</span>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>{p.price}</div>
                  <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{p.desc}</p>
                  <button className={`btn ${p.popular ? "btn-primary" : "btn-outline"}`}
                    onClick={() => handlePay(p.id)} disabled={!!payLoading}
                    style={{ width: "100%", marginTop: "auto" }}>
                    {payLoading === p.id ? "Redirecting…" : "Pay with Flutterwave"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UPLOAD — for paid users (weekly/monthly) */}
        {view === "upload" && (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>Check your document</h1>
            <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 36 }}>
              Upload a .docx file. Tables will be processed. Images will not be scanned.
            </p>
            {error && <p className="form-error" style={{ marginBottom: 20 }}>⚠ {error}</p>}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
              style={{ border: `2px dashed ${dragOver ? "rgba(200,255,0,0.6)" : file ? "rgba(200,255,0,0.35)" : "var(--border)"}`, borderRadius: 12, padding: 48, cursor: "pointer", background: "var(--surface)", textAlign: "center", marginBottom: 24 }}>
              <input ref={fileInputRef} type="file" accept=".docx" style={{ display: "none" }} onChange={e => handleFileSelect(e.target.files[0])} />
              {file ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                  <span style={{ fontSize: 32 }}>📄</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{file.name}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{(file.size / 1024).toFixed(0)} KB</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setFile(null); }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18 }}>✕</button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>⬆</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Drop your .docx here</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>or click to browse — max 10MB</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", background: "rgba(255,255,255,0.04)", display: "inline-block", padding: "4px 12px", borderRadius: 20 }}>
                    Tables processed ✓ &nbsp;·&nbsp; Images skipped ⚠
                  </div>
                </>
              )}
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleUpload} disabled={!file}>Start Analysis</button>
          </div>
        )}

        {/* PROCESSING */}
        {view === "processing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.9s linear infinite", marginBottom: 32 }} />
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, letterSpacing: "-0.02em" }}>Analysing your document</h2>
            <p style={{ fontSize: 15, color: "var(--accent)", marginBottom: 28, fontWeight: 500 }}>{progressMsg}</p>
            <div style={{ width: "100%", maxWidth: 440, height: 6, background: "var(--surface)", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", background: "var(--accent)", width: `${progress}%`, transition: "width 1.5s ease", borderRadius: 3 }} />
            </div>
            <span className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>{progress}%</span>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 32, maxWidth: 360 }}>Keep this tab open. Processing takes a few minutes.</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* DONE */}
        {view === "done" && report && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: 16 }}>✓</span>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>Your document is ready</h1>
            </div>
            <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 32 }}>
              {report.paragraphs_paraphrased} paragraph{report.paragraphs_paraphrased !== 1 ? "s" : ""} rewritten.
              {report.tables_cells_rewritten > 0 && ` ${report.tables_cells_rewritten} table cell${report.tables_cells_rewritten !== 1 ? "s" : ""} rewritten.`}
              {" "}Edited sections are highlighted green in your file.
            </p>
            <div style={{ display: "flex", gap: 20, marginBottom: 32, flexWrap: "wrap" }}>
              {[
                { val: report.total_paragraphs_checked, label: "Checked"       },
                { val: report.paragraphs_paraphrased,   label: "Rewritten"     },
                { val: report.tables_cells_rewritten || 0, label: "Table cells" },
                { val: report.references_skipped,        label: "Refs skipped" },
              ].map(s => (
                <div key={s.label} style={{ padding: "16px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, minWidth: 90 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <button className="btn btn-primary btn-lg" onClick={handleDownload}>⬇ Download Corrected Document</button>
              <button className="btn btn-outline" onClick={reset}>Check Another</button>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 40, padding: "10px 14px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
              ⏱ Your file will be automatically deleted in 1 hour for your privacy.
            </p>
            {report.items?.length > 0 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>What changed</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {report.items.map((item, i) => (
                    <div key={i} style={{ padding: "16px 20px", background: "var(--surface)", border: `1px solid ${item.action === "skipped" ? "var(--border)" : "rgba(200,255,0,0.12)"}`, borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>¶ {item.paragraph}</span>
                        <span className={`badge ${item.action === "paraphrased" ? "badge-green" : ""}`} style={{ fontSize: 10 }}>
                          {item.action === "paraphrased" ? "Rewritten" : "Skipped"}
                        </span>
                      </div>
                      {item.preview && <p style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic", marginBottom: 8, lineHeight: 1.5 }}>"{item.preview}"</p>}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {item.flags.map((f, j) => (
                          <span key={j} style={{ fontSize: 11, color: "var(--muted)", background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 4 }}>⚠ {f}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
