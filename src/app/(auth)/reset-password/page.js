"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token");

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    if (!token) setError("Invalid reset link. Please request a new one.");
  }, [token]);

  const mismatch = confirm.length > 0 && password !== confirm;
  const weak     = password.length > 0 && password.length < 8;

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }

    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Strength indicator
  const strength = password.length === 0 ? null
    : password.length < 8  ? { label: "Too short", color: "#ef4444", w: "25%" }
    : password.length < 12 ? { label: "Decent",    color: "#f59e0b", w: "60%" }
    :                         { label: "Strong",    color: "#22c55e", w: "100%" };

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "40px 36px" }}>

        {done ? (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>✓</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Password updated</h1>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 24 }}>
              Your password has been changed. Redirecting you to login…
            </p>
            <Link href="/login" className="btn btn-primary btn-lg" style={{ display: "block", textAlign: "center" }}>
              Log in now →
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>Set new password</h1>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 32 }}>
              Choose a strong password for your Projekkt account.
            </p>

            {error && (
              <div style={{ marginBottom: 20 }}>
                <p className="form-error">⚠ {error}</p>
                {error.includes("expired") || error.includes("Invalid") ? (
                  <Link href="/forgot-password" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", fontWeight: 600, display: "block", marginTop: 8 }}>
                    Request a new reset link →
                  </Link>
                ) : null}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="field">
                <label>New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  disabled={!token}
                />
                {strength && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 3, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: strength.w, background: strength.color, borderRadius: 99, transition: "width 0.3s, background 0.3s" }} />
                    </div>
                    <span style={{ fontSize: 11, color: strength.color, marginTop: 4, display: "block" }}>{strength.label}</span>
                  </div>
                )}
              </div>

              <div className="field">
                <label>Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Same password again"
                  required
                  disabled={!token}
                  style={mismatch ? { borderColor: "#ef4444" } : {}}
                />
                {mismatch && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, display: "block" }}>Passwords don't match</span>}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading || !token || weak || mismatch}
                style={{ marginTop: 8 }}>
                {loading ? "Updating…" : "Set new password →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
