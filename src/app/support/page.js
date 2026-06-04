"use client";
import Link from "next/link";
import { useState } from "react";

// ── Creative testimonials ─────────────────────────────────────────────────────
// These are placeholder comments — very creative, not the usual ones.
const TESTIMONIALS = [
  {
    initials: "AO",
    name: "Adaeze O.",
    tag: "400-level, Computer Science · UniLag",
    colour: "#5c3bff",
    project: "Final year project",
    quote: "My supervisor kept saying my literature review 'read like Wikipedia.' She can't say that anymore.",
    detail: "Ran my 8,000-word FYP through Projekkt the night before submission. Woke up to a green report and exactly four sections rewritten. Submitted with actual confidence for the first time in four years.",
  },
  {
    initials: "EM",
    name: "Emeka M.",
    tag: "MSc candidate, Electrical Engineering · OAU",
    colour: "#0891b2",
    project: "Thesis chapter",
    quote: "I copy-pasted one too many journal abstracts 'for structure.' Projekkt fixed every single one.",
    detail: "Chapter 2 was basically a collage of other people's methodology sections. I knew it. My examiner would have known it. Now it reads like something I actually wrote — which, technically, Projekkt helped me do.",
  },
  {
    initials: "FI",
    name: "Fatima I.",
    tag: "Freelance technical writer · Lagos",
    colour: "#d97706",
    project: "Client white paper",
    quote: "I handed in the original draft. The client handed it back. I uploaded it here. Problem solved.",
    detail: "A fintech client flagged my white paper for similarity to a competitor's report. I wasn't even aware of the report. Uploaded, processed, downloaded. Delivered the revision same evening. The client asked what I changed — I said 'everything.'",
  },
  {
    initials: "CT",
    name: "Chukwuemeka T.",
    tag: "HND student, Mass Communication · Yabatech",
    colour: "#059669",
    project: "Research paper",
    quote: "My lecturer has a plagiarism detector and a grudge. Projekkt handled the detector. I handled the grudge.",
    detail: "The class knew this particular lecturer scanned everything. Most people just hoped for the best. I used Projekkt, scored 4% similarity, and genuinely enjoyed handing it in.",
  },
  {
    initials: "NK",
    name: "Ngozi K.",
    tag: "PhD student, Biochemistry · UI",
    colour: "#7c3aed",
    project: "Journal submission draft",
    quote: "Reviewers reject papers for a lot of reasons. Similarity to existing literature shouldn't be one of them.",
    detail: "Three of my introduction paragraphs were uncomfortably close to a 2019 paper I'd cited heavily. I knew the ideas were my own — the phrasing just wasn't. Projekkt separated them. Both papers can now coexist in the literature.",
  },
  {
    initials: "SO",
    name: "Samuel O.",
    tag: "Software developer · Abuja",
    colour: "#dc2626",
    project: "Business proposal",
    quote: "I built the proposal from a template. The template built me a problem. Projekkt deleted the problem.",
    detail: "Used a proposal template from a downloaded pack — forgot the template itself had been posted publicly online. My client's procurement team flagged it. Processed the whole thing in under three minutes. Resent. Approved.",
  },
  {
    initials: "BI",
    name: "Blessing I.",
    tag: "300-level, English & Literary Studies · UNIPORT",
    colour: "#0284c7",
    project: "Literary analysis essay",
    quote: "I paraphrase. I just paraphrase the same way the original was phrased. Projekkt fixed my paraphrasing.",
    detail: "English department takes originality very seriously — you'd think of all places they'd appreciate close reading of a text. They do not. My close reading became genuinely original writing after Projekkt's pass, and I kept every argument.",
  },
  {
    initials: "TU",
    name: "Tunde U.",
    tag: "MBA student, Finance · Lagos Business School",
    colour: "#b45309",
    project: "Strategy assignment",
    quote: "My strategy framework was borrowed from a framework. The irony was not lost on me.",
    detail: "Built a whole assignment around a Porter's Five Forces analysis — the structure, the transitions, even some of the phrasing was just the textbook. Three paragraphs flagged, three rewritten, zero regrets. Scored a distinction.",
  },
];

// ── Project help categories ───────────────────────────────────────────────────
const PROJECT_CATEGORIES = [
  {
    icon: "💻",
    label: "Computer science projects",
    desc: "Final year projects, research papers, and documentation for CS-related work.",
    types: [
      "Final year project (FYP) writeup",
      "Software engineering documentation",
      "Machine learning & data science reports",
      "Network security research papers",
      "Algorithm analysis & system design docs",
      "Web / mobile app project reports",
      "Database management project documentation",
      "Embedded systems & IoT writeups",
    ],
  },
  {
    icon: "📖",
    label: "English & humanities projects",
    desc: "Essays, dissertations, and literary analysis for language and arts courses.",
    types: [
      "Literary analysis & criticism essays",
      "Linguistics research papers",
      "Creative writing portfolios",
      "History & social science dissertations",
      "Communication studies papers",
      "Mass communication & journalism projects",
      "Philosophy & ethics essays",
      "English language teaching (ELT) research",
    ],
  },
  {
    icon: "🔬",
    label: "Science & engineering projects",
    desc: "Lab reports, thesis chapters, and technical papers for STEM fields.",
    types: [
      "Chemistry & biochemistry lab reports",
      "Physics experimental write-ups",
      "Civil & mechanical engineering project reports",
      "Environmental science research papers",
      "Medical & nursing research projects",
      "Agricultural science dissertations",
      "Electrical engineering technical documentation",
      "Mathematics & statistics papers",
    ],
  },
  {
    icon: "📊",
    label: "Business & social sciences",
    desc: "Case studies, proposals, and research papers for management and social courses.",
    types: [
      "MBA dissertations & strategy papers",
      "Business plan & proposal documents",
      "Economics research papers",
      "Public administration projects",
      "Accounting & finance research",
      "Marketing research reports",
      "Human resource management papers",
      "Law & political science essays",
    ],
  },
];

// ── FAQ for support ───────────────────────────────────────────────────────────
const SUPPORT_FAQS = [
  { q: "How do I upload a document?",           a: "From your dashboard, click 'New document', choose your .docx file (up to 10MB), confirm the credit cost, and click 'Process'. You'll be notified by email when it's ready." },
  { q: "My upload failed. What now?",           a: "Check that the file is .docx format (not .doc, .pdf, or .pages) and under 10MB. If it still fails, try re-saving the file from Word or Google Docs as .docx and uploading again. If the issue persists, contact us." },
  { q: "I was charged but nothing happened.",   a: "Credits are only deducted after processing begins. If you see a charge but no result, email us at support@shaddies.space with your registered email and the approximate time of the transaction — we'll investigate within 24 hours." },
  { q: "Can I get a refund on credits?",        a: "Credits are non-refundable once purchased. However, if a processing error on our side consumes credits incorrectly, we will restore them. Email us with details." },
  { q: "How long does processing take?",        a: "Most documents (under 5,000 words) are processed in under 3 minutes. Longer documents may take up to 10 minutes. You'll receive an email notification when your document is ready." },
  { q: "The rewritten version changed my meaning.", a: "Projekkt aims to preserve your argument while rephrasing the expression. If a rewrite has changed your meaning, you can edit the output freely — the document is yours. Contact us if you believe there is a systematic issue." },
];

function FaqItem({ q, a, isOpen, onToggle }) {
  return (
    <div style={{ borderTop: "1px solid var(--border)", padding: "16px 0", cursor: "pointer" }} onClick={onToggle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{q}</span>
        <span style={{ color: "var(--accent)", fontSize: 18, flexShrink: 0, transition: "transform 0.2s", transform: isOpen ? "rotate(45deg)" : "rotate(0)" }}>+</span>
      </div>
      {isOpen && (
        <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginTop: 10 }}>{a}</p>
      )}
    </div>
  );
}

function TestimonialCard({ t, isExpanded, onToggle }) {
  return (
    <div onClick={onToggle} style={{ padding: 24, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, cursor: "pointer", transition: "border-color 0.2s, box-shadow 0.2s", position: "relative", overflow: "hidden" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(92,59,255,0.25)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>

      {/* Colour accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: t.colour, borderRadius: "14px 14px 0 0" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: t.colour + "22", border: `1.5px solid ${t.colour}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: t.colour }}>{t.initials}</span>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
          <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{t.tag}</div>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>{isExpanded ? "▲" : "▼"}</span>
      </div>

      <p style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.5, fontStyle: "italic", color: "var(--text)", marginBottom: isExpanded ? 14 : 0 }}>
        "{t.quote}"
      </p>

      {isExpanded && (
        <div style={{ animation: "fadeIn 0.2s ease" }}>
          <div style={{ height: 1, background: "var(--border)", margin: "14px 0" }} />
          <span className="mono" style={{ fontSize: 10, color: t.colour, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>{t.project}</span>
          <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{t.detail}</p>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const [faqOpen, setFaqOpen] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [openCategory, setOpenCategory] = useState(null);
  const [contactSent, setContactSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: wire to backend contact endpoint
    setContactSent(true);
  }

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

      {/* Hero */}
      <section style={{ padding: "72px 24px 56px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 760, margin: "auto" }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Support</p>
          <h1 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16, lineHeight: 1.1 }}>How can we help?</h1>
          <p style={{ fontSize: 16, color: "var(--text2)", lineHeight: 1.7, maxWidth: 560 }}>
            Questions about your document, your credits, or your account — we're here.
            You can also use this page to reach out if you need someone to handle your project from scratch.
          </p>
        </div>
      </section>

      {/* Quick links */}
      <section style={{ padding: "48px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1080, margin: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          {[
            { icon: "📧", label: "Email us",          sub: "support@shaddies.space", href: "mailto:support@shaddies.space" },
            { icon: "⚡", label: "Response time",     sub: "Within 24 hours", href: null },
            { icon: "📋", label: "Terms of service",  sub: "Read before you use", href: "/terms" },
            { icon: "🔒", label: "Privacy",           sub: "Your files are deleted in 1 hour", href: "#privacy" },
          ].map((item, i) => (
            item.href
              ? <a key={i} href={item.href} style={{ padding: "22px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, textDecoration: "none", display: "block", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(92,59,255,0.25)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{item.sub}</div>
                </a>
              : <div key={i} style={{ padding: "22px 24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{item.sub}</div>
                </div>
          ))}
        </div>
      </section>

      {/* ── We can handle your project ── */}
      <section style={{ padding: "72px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1080, margin: "auto" }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Project help</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }} className="project-help-grid">
            <div>
              <h2 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, letterSpacing: "-0.025em", marginBottom: 18, lineHeight: 1.15 }}>
                Need someone to handle the whole project?
              </h2>
              <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.8, marginBottom: 18 }}>
                Projekkt can process and polish your existing document. But if you need a full writeup — from scratch or from notes — our team handles computer science projects, English and humanities papers, and science course assignments.
              </p>
              <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.8, marginBottom: 28 }}>
                Tell us your course, your topic, and your deadline. We'll let you know if we can take it on and what it costs.
              </p>
              <a href="mailto:projects@shaddies.space" className="btn btn-primary btn-lg">
                Reach out for project help →
              </a>
              <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>projects@shaddies.space · we respond within 24 hours</p>
            </div>

            {/* Category accordion */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PROJECT_CATEGORIES.map((cat, i) => (
                <div key={i} style={{ border: `1px solid ${openCategory === i ? "rgba(92,59,255,0.25)" : "var(--border)"}`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s" }}>
                  <button onClick={() => setOpenCategory(openCategory === i ? null : i)}
                    style={{ width: "100%", padding: "16px 20px", background: openCategory === i ? "rgba(92,59,255,0.04)" : "var(--surface)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                    <span style={{ fontSize: 20 }}>{cat.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{cat.label}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{cat.desc}</div>
                    </div>
                    <span style={{ color: "var(--accent)", fontSize: 18, flexShrink: 0, transition: "transform 0.2s", transform: openCategory === i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                  </button>

                  {openCategory === i && (
                    <div style={{ padding: "12px 20px 20px", borderTop: "1px solid var(--border)", animation: "fadeIn 0.2s ease" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {cat.types.map((type, j) => (
                          <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text2)" }}>
                            <span style={{ color: "var(--accent)", flexShrink: 0, fontWeight: 700 }}>✓</span>
                            {type}
                          </div>
                        ))}
                      </div>
                      <a href="mailto:projects@shaddies.space" className="btn btn-primary" style={{ fontSize: 12, padding: "8px 16px", marginTop: 16, display: "inline-block" }}>
                        Enquire about {cat.label.toLowerCase()}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: "72px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1080, margin: "auto" }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>What people say</p>
          <h2 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, letterSpacing: "-0.025em", marginBottom: 8, lineHeight: 1.15 }}>
            Real documents. Real deadlines. Real relief.
          </h2>
          <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 40 }}>Click any card to read the full story.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={i} t={t} isExpanded={expandedCard === i} onToggle={() => setExpandedCard(expandedCard === i ? null : i)} />
            ))}
          </div>

          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 28, textAlign: "center" }}>
            * Names and identifying details changed for privacy. Stories are representative of real user experiences.
          </p>
        </div>
      </section>

      {/* ── Support FAQ ── */}
      <section style={{ padding: "72px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 680, margin: "auto" }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>FAQ</p>
          <h2 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, letterSpacing: "-0.025em", marginBottom: 36 }}>Common support questions.</h2>
          <div>
            {SUPPORT_FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} isOpen={faqOpen === i} onToggle={() => setFaqOpen(faqOpen === i ? null : i)} />
            ))}
            <div style={{ borderTop: "1px solid var(--border)" }} />
          </div>
        </div>
      </section>

      {/* ── Contact form ── */}
      <section style={{ padding: "72px 24px 96px" }}>
        <div style={{ maxWidth: 560, margin: "auto" }}>
          <p className="mono" style={{ fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Contact</p>
          <h2 style={{ fontSize: "clamp(24px,4vw,38px)", fontWeight: 900, letterSpacing: "-0.025em", marginBottom: 8 }}>Send us a message.</h2>
          <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.7, marginBottom: 36 }}>
            Can't find the answer above? We'll get back to you within 24 hours.
          </p>

          {contactSent ? (
            <div style={{ padding: 32, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Message sent</h3>
              <p style={{ fontSize: 14, color: "var(--text2)" }}>We'll get back to you at {form.email} within 24 hours.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* TODO: wire onSubmit to POST /api/contact */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, background: "var(--bg)", color: "var(--text)", fontFamily: "'Cabinet Grotesk', sans-serif" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Email</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, background: "var(--bg)", color: "var(--text)", fontFamily: "'Cabinet Grotesk', sans-serif" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Subject</label>
                <select
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, background: "var(--bg)", color: "var(--text)", fontFamily: "'Cabinet Grotesk', sans-serif", appearance: "none" }}>
                  <option value="">Select a topic</option>
                  <option value="upload">Problem uploading a document</option>
                  <option value="credits">Credits or payment issue</option>
                  <option value="output">Issue with the output</option>
                  <option value="project">I need help with a full project</option>
                  <option value="account">Account or login issue</option>
                  <option value="other">Something else</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 6 }}>Message</label>
                <textarea
                  placeholder="Describe your issue or question in detail…"
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={5}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 10, fontSize: 14, background: "var(--bg)", color: "var(--text)", fontFamily: "'Cabinet Grotesk', sans-serif", resize: "vertical" }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.email || !form.message}
                className="btn btn-primary btn-lg"
                style={{ alignSelf: "flex-start", opacity: (!form.name || !form.email || !form.message) ? 0.45 : 1 }}>
                Send message →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 24px" }}>
        <div style={{ maxWidth: 1080, margin: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
            PROJEKKT — by <a href="https://shaddies.space" style={{ color: "var(--accent)", textDecoration: "none" }}>Shaddies Space</a>
          </span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/"      style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>Home</Link>
            <Link href="/terms" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>Terms</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 860px) {
          .project-help-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </div>
  );
}
