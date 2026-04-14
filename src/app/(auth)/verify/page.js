"use client";
import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, saveToken, saveUser } from "@/lib/api";

function VerifyInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const userId       = searchParams.get("userId");
  const email        = searchParams.get("email");

  const [digits, setDigits]       = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const inputRefs                 = useRef([]);

  function handleDigit(i, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) { setError("Enter all 6 digits."); return; }
    setError("");
    setLoading(true);
    try {
      const data = await api.verifyCode({ userId: parseInt(userId), code });
      saveToken(data.token);
      saveUser(data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError("");
    setSuccess("");
    try {
      await fetch("/api/auth/verify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: parseInt(userId) }),
      });
      setSuccess("New code sent. Check your email.");
    } catch {
      setError("Could not resend. Try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "40px 36px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em" }}>Check your email</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 32 }}>
          We sent a 6-digit code to <strong style={{ color: "var(--text)" }}>{email || "your email"}</strong>. Enter it below.
        </p>

        {error   && <p className="form-error" style={{ marginBottom: 20 }}>⚠ {error}</p>}
        {success && <p style={{ fontSize: 13, color: "var(--accent)", background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>{success}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28 }} onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  width: 52, height: 60,
                  textAlign: "center",
                  fontSize: 24, fontWeight: 700,
                  background: "var(--bg2)",
                  border: `1px solid ${d ? "rgba(200,255,0,0.5)" : "var(--border)"}`,
                  borderRadius: 8,
                  color: "var(--text)",
                  fontFamily: "'DM Mono', monospace",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
              />
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Verifying…" : "Verify email →"}
          </button>
        </form>

        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 24, textAlign: "center" }}>
          Didn't get it?{" "}
          <button onClick={handleResend} disabled={resending}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontWeight: 600, fontSize: 13, padding: 0 }}>
            {resending ? "Sending…" : "Resend code"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div style={{ color: "var(--muted)", textAlign: "center", paddingTop: 80 }}>Loading…</div>}>
      <VerifyInner />
    </Suspense>
  );
}
