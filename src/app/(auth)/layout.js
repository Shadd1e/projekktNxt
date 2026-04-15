import Link from "next/link";

export default function AuthLayout({ children }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      background: "var(--bg)",
    }}>
      <Link href="/" style={{ marginBottom: 36, textDecoration: "none" }}>
        <span className="mono" style={{ fontSize: 16, fontWeight: 500, color: "var(--accent)", letterSpacing: "0.12em" }}>PROJEKKT</span>
      </Link>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {children}
      </div>
    </div>
  );
}
