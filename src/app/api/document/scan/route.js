export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";

// ── Pricing (internal — never sent to frontend directly) ──────────────────────
// Users see naira and section counts. They never see "credits" or "₦0.50/word".
const NAIRA_PER_WORD = 0.5;   // ₦0.50 per flagged word
const MIN_CHARGE     = 250;   // ₦250 minimum if anything is flagged (not 500 credits)

export function calculateNairaCharge(flaggedWordCount) {
  if (flaggedWordCount === 0) return 0;
  const raw = Math.ceil(flaggedWordCount * NAIRA_PER_WORD);
  return Math.max(raw, MIN_CHARGE);
}

// Convert naira charge to internal credits (1 credit = ₦1)
export function nairaToCredits(naira) {
  return naira;
}

export async function POST(request) {
  try {
    // Scanning is intentionally public — no auth required.
    // Auth is only needed at the upload/process step (when credits are charged).

    const formData = await request.formData();
    const file     = formData.get("file");

    if (!file)
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!file.name.endsWith(".docx"))
      return NextResponse.json({ error: "Only .docx files are accepted." }, { status: 400 });

    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > 10 * 1024 * 1024)
      return NextResponse.json({ error: "File exceeds 10MB limit." }, { status: 400 });

    // ── Call Python /prescan — runs full detection, no rewriting ─────────────
    const PYTHON_SERVICE_URL  = process.env.PYTHON_SERVICE_URL;
    const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

    const form = new FormData();
    form.append(
      "file",
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
      file.name
    );

    const res = await fetch(`${PYTHON_SERVICE_URL}/prescan`, {
      method:  "POST",
      headers: { "x-internal-secret": INTERNAL_API_SECRET },
      body:    form,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || "Scan service unavailable. Please try again." },
        { status: 502 }
      );
    }

    const scan = await res.json();
    // scan = { total_paragraphs, flagged_sections, flagged_word_count,
    //          total_word_count, issues: { ai_written, web_plagiarism, academic, internal_copy } }

    const charge  = calculateNairaCharge(scan.flagged_word_count);
    const credits = nairaToCredits(charge);  // stored internally for deduction

    // ── Build user-facing result — no mention of credits, kobo, or per-word ──
    let verdict;
    let costLine;
    let issueLines = [];

    if (scan.flagged_sections === 0) {
      // Clean document — free, no charge
      verdict  = "clean";
      costLine = null;
    } else {
      verdict  = "flagged";
      costLine = `${scan.flagged_sections} section${scan.flagged_sections === 1 ? "" : "s"} need${scan.flagged_sections === 1 ? "s" : ""} fixing — ₦${charge.toLocaleString()}`;

      // Build plain-English breakdown of issue types
      const { ai_written, web_plagiarism, academic, internal_copy } = scan.issues;
      if (ai_written > 0)    issueLines.push(`${ai_written} section${ai_written > 1 ? "s" : ""} detected as AI-written`);
      if (web_plagiarism > 0) issueLines.push(`${web_plagiarism} section${web_plagiarism > 1 ? "s" : ""} matched content found online`);
      if (academic > 0)       issueLines.push(`${academic} section${academic > 1 ? "s" : ""} matched academic sources`);
      if (internal_copy > 0)  issueLines.push(`${internal_copy} section${internal_copy > 1 ? "s" : ""} repeated too closely within the document`);
    }

    return NextResponse.json({
      // What the UI shows
      verdict,          // "clean" | "flagged"
      costLine,         // e.g. "6 sections need fixing — ₦320"  (null if clean)
      issueLines,       // ["3 sections detected as AI-written", ...]
      totalSections:    scan.total_paragraphs,
      flaggedSections:  scan.flagged_sections,

      // Hidden details — available if user clicks "how is this calculated?"
      _detail: {
        flaggedWords:  scan.flagged_word_count,
        totalWords:    scan.total_word_count,
        chargeNaira:   charge,
        issues:        scan.issues,
      },

      // Internal — used by /upload to match exactly what was shown at scan time
      _internal: {
        credits_needed: credits,
      },
    });
  } catch (err) {
    console.error("[document/scan]", err);
    return NextResponse.json({ error: "Could not scan document. Please try again." }, { status: 500 });
  }
}
