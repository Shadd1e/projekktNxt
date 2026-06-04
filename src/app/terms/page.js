"use client";
import Link from "next/link";

const LAST_UPDATED = "June 2025";

const SECTIONS = [
  {
    id: "acceptance",
    title: "1. Acceptance of terms",
    body: [
      "By creating an account or uploading any document to Projekkt, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.",
      "These terms apply to all users — students, researchers, and professionals — regardless of how they access Projekkt (web browser, API, or any future client).",
      "We may update these terms from time to time. We will notify registered users by email when material changes are made. Continued use of the service after notification constitutes acceptance of the revised terms.",
    ],
  },
  {
    id: "service",
    title: "2. Description of service",
    body: [
      "Projekkt is a document editing service. You upload a .docx file; we analyse it for similarity to external sources, flag sections that may raise questions, and rewrite those sections. You then download the revised document.",
      "Projekkt is a writing assistance and editorial tool. It does not guarantee any particular outcome in any academic, professional, or legal context. It is your responsibility to review all output before submission.",
      "We reserve the right to modify, suspend, or discontinue any part of the service at any time, with or without notice.",
    ],
  },
  {
    id: "eligibility",
    title: "3. Eligibility",
    body: [
      "You must be at least 16 years old to use Projekkt. By using the service you represent that you meet this requirement.",
      "You may not create more than one account. Duplicate accounts may be suspended without refund of unused credits.",
      "Projekkt is currently intended for users in Nigeria and accepts payment in Nigerian Naira. Access from other jurisdictions is permitted but payment processing and support may be limited.",
    ],
  },
  {
    id: "account",
    title: "4. Your account",
    body: [
      "You are responsible for maintaining the security of your account credentials. Do not share your password. We are not liable for any loss or damage arising from unauthorised access to your account.",
      "You agree to provide accurate information when registering. False information — including using someone else's email address — may result in account termination.",
      "You may delete your account at any time from the account settings page. Unused credits are non-refundable upon account deletion.",
    ],
  },
  {
    id: "credits",
    title: "5. Credits and payment",
    body: [
      "Projekkt operates on a pre-purchased credit system. One credit equals ₦0.50 and covers the analysis and rewriting of one word in your document.",
      "Credits are non-refundable once purchased, except where required by applicable law. Credits do not expire as long as your account remains active.",
      "All payments are processed by Paystack. By purchasing credits you also agree to Paystack's terms of service. Projekkt does not store your card details.",
      "If a transaction fails or is disputed, we reserve the right to suspend access to your account pending resolution.",
    ],
  },
  {
    id: "documents",
    title: "6. Your documents",
    body: [
      "You retain all intellectual property rights in the content you upload. By uploading a document, you grant Projekkt a limited, temporary licence to process it solely for the purpose of providing the service.",
      "Uploaded files are automatically and permanently deleted from our servers one hour after processing is complete. We do not read, store, sell, or share your document content.",
      "You represent that you have the right to upload each document and that doing so does not violate any third-party intellectual property rights, privacy rights, or applicable law.",
      "Do not upload documents containing sensitive personal data (e.g. medical records, identity numbers, financial account details) beyond what is necessary for your own writing.",
    ],
  },
  {
    id: "prohibited",
    title: "7. Prohibited uses",
    body: [
      "You may not use Projekkt to process content that is unlawful, defamatory, obscene, threatening, or that infringes third-party rights.",
      "You may not attempt to reverse-engineer, scrape, or otherwise extract the underlying models, algorithms, or infrastructure of the service.",
      "You may not use automated scripts or bots to upload documents or interact with the service in ways not intended for human users.",
      "Academic institutions and examiners may not use Projekkt to submit processed documents as a control test or to entrap students without their knowledge.",
    ],
  },
  {
    id: "disclaimer",
    title: "8. Disclaimer of warranties",
    body: [
      "Projekkt is provided \"as is\" and \"as available\" without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement.",
      "We do not warrant that the service will be uninterrupted, error-free, or free of harmful components. We do not warrant that any rewritten content will achieve a specific similarity score or pass any particular plagiarism detection tool.",
      "You use the service entirely at your own risk. Always review the output yourself before submitting any document.",
    ],
  },
  {
    id: "liability",
    title: "9. Limitation of liability",
    body: [
      "To the fullest extent permitted by applicable law, Projekkt and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.",
      "Our total liability to you for any claim arising from use of the service shall not exceed the total amount you paid us in the 90 days preceding the claim.",
      "Some jurisdictions do not allow certain liability exclusions. In those cases, our liability is limited to the minimum extent permitted by law.",
    ],
  },
  {
    id: "termination",
    title: "10. Termination",
    body: [
      "We may suspend or terminate your account at any time if we believe you have violated these terms, without prior notice and without refund of unused credits.",
      "You may terminate your account at any time. Upon termination, your right to use the service ceases immediately.",
      "Sections 6 (Your documents), 8 (Disclaimer), 9 (Liability), and 11 (Governing law) survive termination.",
    ],
  },
  {
    id: "law",
    title: "11. Governing law",
    body: [
      "These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.",
      "If any provision of these terms is found to be unenforceable, the remaining provisions continue in full force.",
    ],
  },
  {
    id: "contact",
    title: "12. Contact",
    body: [
      "Questions about these terms? Email us at legal@shaddies.space or use the contact form on our support page.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'Cabinet Grotesk', sans-serif" }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 99, borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1080, margin: "auto", padding: "0 24px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" className="mono" style={{ fontSize: 14, fontWeight: 500, color: "var(--accent)", letterSpacing: "0.12em", textDecoration: "none" }}>PROJEKKT</Link>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/login"    className="btn btn-outline" style={{ padding: "7px 16px", fontSize: 13 }}>Log in</Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: "7px 16px", fontSize: 13 }}>Get started</Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section style={{ padding: "72px 24px 48px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 760, margin: "auto" }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Legal</p>
          <h1 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16, lineHeight: 1.1 }}>Terms of service</h1>
          <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7 }}>
            These terms govern your use of Projekkt. Please read them before using the service.
          </p>
          <p className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      {/* Body */}
      <section style={{ padding: "64px 24px 96px" }}>
        <div style={{ maxWidth: 760, margin: "auto", display: "grid", gridTemplateColumns: "200px 1fr", gap: "0 64px", alignItems: "start" }} className="terms-grid">

          {/* Sticky sidebar TOC */}
          <div style={{ position: "sticky", top: 70 }}>
            <p className="mono" style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Contents</p>
            <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {SECTIONS.map(s => (
                <a key={s.id} href={`#${s.id}`}
                  style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none", padding: "4px 0", borderLeft: "2px solid var(--border)", paddingLeft: 10, transition: "color 0.15s, border-color 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
                  {s.title}
                </a>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div>
            {SECTIONS.map((s, i) => (
              <div key={s.id} id={s.id} style={{ marginBottom: 48, paddingBottom: 48, borderBottom: i < SECTIONS.length - 1 ? "1px solid var(--border)" : "none" }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 20 }}>{s.title}</h2>
                {s.body.map((para, j) => (
                  <p key={j} style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.8, marginBottom: j < s.body.length - 1 ? 16 : 0 }}>{para}</p>
                ))}
              </div>
            ))}

            {/* Final contact box */}
            <div style={{ padding: 28, background: "rgba(92,59,255,0.04)", border: "1px solid rgba(92,59,255,0.15)", borderRadius: 14, marginTop: 8 }}>
              <p className="mono" style={{ fontSize: 10, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Questions?</p>
              <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, marginBottom: 18 }}>
                If anything in these terms is unclear, reach out before you agree to them.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a href="mailto:legal@shaddies.space" className="btn btn-primary" style={{ fontSize: 13, padding: "8px 18px" }}>Email legal@shaddies.space</a>
                <Link href="/support" className="btn btn-outline" style={{ fontSize: 13, padding: "8px 18px" }}>Open support</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
            PROJEKKT — by <a href="https://shaddies.space" style={{ color: "var(--accent)", textDecoration: "none" }}>Shaddies Space</a>
          </span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/"        style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>Home</Link>
            <Link href="/support" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>Support</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 680px) {
          .terms-grid { grid-template-columns: 1fr !important; }
          .terms-grid > div:first-child { display: none; }
        }
      `}</style>
    </div>
  );
}
