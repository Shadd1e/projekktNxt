export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

// ── Pricing: ₦1 per 2 words (₦0.50 per word), minimum ₦500 ──────────────────
const PRICE_PER_WORD = 0.50;
const MINIMUM_PRICE  = 500;

function calculatePrice(wordCount) {
  const raw = Math.ceil(wordCount * PRICE_PER_WORD);
  return Math.max(raw, MINIMUM_PRICE);
}

// ── Parse .docx in JS using raw XML ──────────────────────────────────────────
// We use the JSZip-compatible approach via ArrayBuffer — no heavy dependencies
async function analyseDocx(buffer) {
  // We forward the file to the Python service for analysis
  // Python returns: word_count, paragraph_count, table_count, image_count
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

    const analysis = await analyseDocx(buffer);
    const price    = calculatePrice(analysis.word_count);

    return NextResponse.json({
      word_count:      analysis.word_count,
      paragraph_count: analysis.paragraph_count,
      table_count:     analysis.table_count,
      image_count:     analysis.image_count,
      price,
      price_breakdown: `₦0.50 × ${analysis.word_count} words = ₦${price.toLocaleString()}`,
    });
  } catch (err) {
    console.error("[document/scan]", err);
    return NextResponse.json({ error: "Could not analyse document. Please try again." }, { status: 500 });
  }
}
