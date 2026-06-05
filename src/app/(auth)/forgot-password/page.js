"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "40px 36px" }}>

        {sent ? (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>📬</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, letterSpacing: "-0.02em" }}>Check your email</h1>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 28 }}>
              If an account exists for <strong style={{ color: "var(--text)" }}>{email}</strong>, 
              we've sent a password reset link. It expires in 1 hour.
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
              Didn't get it? Check your spam folder, or{" "}
              <button
                onClick={() => { setSent(false); }}
                style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                try again
              </button>.
            </p>
            <Link href="/login" className="btn btn-outline" style={{ width: "100%", display: "block", textAlign: "center", fontSize: 14, padding: "10px 20px" }}>
              Back to login
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>Forgot your password?</h1>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 32, lineHeight: 1.6 }}>
              Enter your email and we'll send you a link to reset it.
            </p>

            {error && <p className="form-error" style={{ marginBottom: 20 }}>⚠ {error}</p>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="field">
                <label>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !email} style={{ marginTop: 8 }}>
                {loading ? "Sending…" : "Send reset link →"}
              </button>
            </form>

            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 24, textAlign: "center" }}>
              Remembered it?{" "}
              <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
