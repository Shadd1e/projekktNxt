export const dynamic    = 'force-dynamic';
export const maxDuration = 15; // this should resolve in under 2s — Railway's /analyse has no AI calls

import { NextResponse } from "next/server";

const MAX_PARAGRAPHS = 40; // mirrors the Railway-side cap — checked here too so we
                            // can reject before the user even clicks "Start scan"

// Rough time band based on our batched pipeline:
// fixed overhead (~10s for the two HF batch calls) + per-paragraph plagiarism
// checks running in concurrent batches of 5. Deliberately wide — better to
// under-promise than show a number that's wrong half the time.
function estimateSeconds(paragraphCount) {
  const batches = Math.max(1, Math.ceil(paragraphCount / 5));
  const min = 10 + batches * 3;
  const max = 15 + batches * 8;
  return { min, max };
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file)
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!file.name.endsWith(".docx"))
      return NextResponse.json({ error: "Only .docx files are accepted." }, { status: 400 });

    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > 10 * 1024 * 1024)
      return NextResponse.json({ error: "File exceeds 10MB limit." }, { status: 400 });

    const PYTHON_SERVICE_URL  = process.env.PYTHON_SERVICE_URL;
    const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

    const form = new FormData();
    form.append(
      "file",
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      file.name
    );

    const railwayRes = await fetch(`${PYTHON_SERVICE_URL}/analyse`, {
      method:  "POST",
      headers: { "x-internal-secret": INTERNAL_API_SECRET },
      body:    form,
      signal:  AbortSignal.timeout(10_000),
    });

    if (!railwayRes.ok) {
      const body = await railwayRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: body?.detail || "Could not read document." },
        { status: railwayRes.status }
      );
    }

    const analysis = await railwayRes.json();
    const { paragraph_count, word_count, table_count, image_count } = analysis;

    if (paragraph_count > MAX_PARAGRAPHS) {
      return NextResponse.json(
        {
          error: `This document has ${paragraph_count} paragraphs (max ${MAX_PARAGRAPHS} — ` +
                 `please submit one chapter at a time).`,
        },
        { status: 400 }
      );
    }

    const { min, max } = estimateSeconds(paragraph_count);

    return NextResponse.json({
      paragraphCount: paragraph_count,
      wordCount:      word_count,
      tableCount:     table_count,
      imageCount:     image_count,
      estimateMin:    min,
      estimateMax:    max,
      estimateLabel:  `~${min}–${max} seconds`,
    });

  } catch (err) {
    console.error("[document/analyse]", err);
    return NextResponse.json(
      { error: "Could not check document. Please try again." },
      { status: 500 }
    );
  }
}
