"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getUser, saveUser } from "@/lib/api";

export default function PaymentCallbackPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const status       = searchParams.get("status");

  const [state, setState] = useState("loading");

  useEffect(() => {
    if (status === "successful" || status === "completed") {
      const user = getUser();
      if (user) saveUser({ ...user, isPaid: true });
      setState("success");
      setTimeout(() => router.push("/dashboard"), 3000);
    } else if (status === "cancelled" || status === "failed") {
      setState("failed");
    } else {
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }, [status]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "48px 36px", textAlign: "center" }}>
        <Link href="/" style={{ textDecoration: "none", display: "block", marginBottom: 40 }}>
          <span className="mono" style={{ fontSize: 15, fontWeight: 500, color: "var(--accent)", letterSpacing: "0.1em" }}>PROJEKKT</span>
        </Link>

        {state === "loading" && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin 0.9s linear infinite", margin: "0 auto 24px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Confirming payment…</h2>
            <p style={{ fontSize: 14, color: "var(--muted)" }}>Hang on. You'll be redirected shortly.</p>
          </>
        )}

        {state === "success" && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(200,255,0,0.12)", border: "1px solid rgba(200,255,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 22, color: "var(--accent)" }}>✓</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Payment confirmed!</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>Your plan is now active. Taking you to the dashboard…</p>
            <Link href="/dashboard" className="btn btn-primary btn-lg" style={{ width: "100%" }}>Go to Dashboard →</Link>
          </>
        )}

        {state === "failed" && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,77,77,0.1)", border: "1px solid rgba(255,77,77,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 22, color: "var(--danger)" }}>✕</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Payment not completed</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>No charge was made. You can try again from the dashboard.</p>
            <Link href="/dashboard?showPlans=1" className="btn btn-primary btn-lg" style={{ width: "100%" }}>Try Again</Link>
          </>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
