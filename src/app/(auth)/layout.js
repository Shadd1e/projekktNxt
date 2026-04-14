import Link from "next/link";

export default function AuthLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--bg)" }}>
      <Link href="/" style={{ marginBottom: 40, textDecoration: "none" }}>
        <span className="mono" style={{ fontSize: 18, fontWeight: 500, color: "var(--accent)", letterSpacing: "0.1em" }}>PROJEKKT</span>
      </Link>
      {children}
    </div>
  );
}
