export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

// ── Credit pricing ────────────────────────────────────────────────────────────
// 0.5 credits per word, minimum 500 credits.
// First FREE_WORDS words are always free (subtracted before calculation).
// ─────────────────────────────────────────────────────────────────────────────
const CREDIT_COST_PER_WORD = 0.5;
const MINIMUM_CREDITS      = 500;
const FREE_WORDS           = 2000;   // first 2,000 words are on us

function calculateCredits(wordCount) {
  const billableWords = Math.max(wordCount - FREE_WORDS, 0);
  if (billableWords === 0) return 0;                          // fully free
  const raw = Math.ceil(billableWords * CREDIT_COST_PER_WORD);
  return Math.max(raw, MINIMUM_CREDITS);
}

// ── Forward file to Python analysis service ───────────────────────────────────
async function analyseDocx(buffer) {
  const PYTHON_SERVICE_URL  = process.env.PYTHON_SERVICE_URL;
  const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

  const form = new FormData();
  form.append(
    "file",
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
    "document.docx"
  );

  const res = await fetch(`${PYTHON_SERVICE_URL}/analyse`, {
    method:  "POST",
    headers: { "x-internal-secret": INTERNAL_API_SECRET },
    body:    form,
  });

  if (!res.ok) throw new Error("Analysis service unavailable.");
  return res.json();
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const formData = await request.formData();
    const file     = formData.get("file");

    if (!file)
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!file.name.endsWith(".docx"))
      return NextResponse.json({ error: "Only .docx files are accepted." }, { status: 400 });

    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > 10 * 1024 * 1024)
      return NextResponse.json({ error: "File exceeds 10MB limit." }, { status: 400 });

    const analysis      = await analyseDocx(buffer);
    const wordCount     = analysis.word_count;
    const credits_needed = calculateCredits(wordCount);

    // Human-readable breakdown shown in the UI
    const billableWords = Math.max(wordCount - FREE_WORDS, 0);
    let breakdown;
    if (credits_needed === 0) {
      breakdown = `${wordCount.toLocaleString()} words — fully covered by your free ${FREE_WORDS.toLocaleString()} words`;
    } else {
      breakdown = `${wordCount.toLocaleString()} words − ${FREE_WORDS.toLocaleString()} free = ${billableWords.toLocaleString()} billable × 0.5 cr = ${credits_needed.toLocaleString()} credits`;
    }

    return NextResponse.json({
      word_count:      wordCount,
      paragraph_count: analysis.paragraph_count,
      table_count:     analysis.table_count,
      image_count:     analysis.image_count,
      credits_needed,
      free_words:      FREE_WORDS,
      billable_words:  billableWords,
      breakdown,
    });
  } catch (err) {
    console.error("[document/scan]", err);
    return NextResponse.json({ error: "Could not analyse document. Please try again." }, { status: 500 });
  }
}
