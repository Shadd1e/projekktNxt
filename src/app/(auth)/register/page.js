"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.register({ email, password });
      // Always go to verify page — even if email failed, user can resend there
      router.push(`/verify?userId=${data.userId}&email=${encodeURIComponent(email)}&emailSent=${data.emailSent}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "40px 36px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>Create account</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 32 }}>We'll send a verification code to your email.</p>

        {error && <p className="form-error" style={{ marginBottom: 20 }}>⚠ {error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="field">
            <label>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>

        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 24, textAlign: "center" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
