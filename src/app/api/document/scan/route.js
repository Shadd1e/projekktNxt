export const dynamic    = 'force-dynamic';
export const maxDuration = 30; // just a file upload + one fast Railway call

import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";

// ── Pricing ───────────────────────────────────────────────────────────────────
const NAIRA_PER_WORD = 0.5;
const MIN_CHARGE     = 250;

export function calculateNairaCharge(flaggedWordCount) {
  if (flaggedWordCount === 0) return 0;
  const raw = Math.ceil(flaggedWordCount * NAIRA_PER_WORD);
  return Math.max(raw, MIN_CHARGE);
}

export function nairaToCredits(naira) {
  return naira;
}

export async function POST(request) {
  try {
    await initDB();

    const formData = await request.formData();
    const file     = formData.get("file");

    if (!file)
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!file.name.endsWith(".docx"))
      return NextResponse.json({ error: "Only .docx files are accepted." }, { status: 400 });

    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > 10 * 1024 * 1024)
      return NextResponse.json({ error: "File exceeds 10MB limit." }, { status: 400 });

    // Forward file to Railway — Railway validates, registers the job,
    // and returns immediately with a job_id. No heavy work runs here.
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

    // 20s timeout — Railway should respond in < 2s (just validates + registers job)
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 20_000);

    let railwayRes;
    try {
      railwayRes = await fetch(`${PYTHON_SERVICE_URL}/prescan`, {
        method:  "POST",
        headers: { "x-internal-secret": INTERNAL_API_SECRET },
        body:    form,
        signal:  controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!railwayRes.ok) {
      const body = await railwayRes.json().catch(() => ({}));
      // Surface Railway's validation errors (e.g. too many paragraphs)
      const msg = body?.detail || "Could not start scan. Please try again.";
      return NextResponse.json({ error: msg }, { status: railwayRes.status });
    }

    const { job_id: railwayJobId } = await railwayRes.json();

    // Create a scan job record that stores the Railway job_id for polling
    const record = await pool.query(
      `INSERT INTO scan_jobs (scan_job_id, railway_job_id, status)
       VALUES (gen_random_uuid(), $1, 'processing')
       RETURNING scan_job_id`,
      [railwayJobId]
    );
    const scanJobId = record.rows[0].scan_job_id;

    return NextResponse.json({ scanJobId, status: "processing" });

  } catch (err) {
    console.error("[document/scan]", err);
    return NextResponse.json(
      { error: "Could not start scan. Please try again." },
      { status: 500 }
    );
  }
}
