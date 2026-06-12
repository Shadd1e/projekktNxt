export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { waitUntil } from '@vercel/functions';
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

// Runs in background — stores result in scan_jobs table
async function _runPrescanInBackground({ scanJobId, fileBuffer, fileName }) {
  const PYTHON_SERVICE_URL  = process.env.PYTHON_SERVICE_URL;
  const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

  try {
    const form = new FormData();
    form.append(
      "file",
      new Blob([fileBuffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
      fileName
    );

    const res = await fetch(`${PYTHON_SERVICE_URL}/prescan`, {
      method:  "POST",
      headers: { "x-internal-secret": INTERNAL_API_SECRET },
      body:    form,
    });

    if (!res.ok) {
      await pool.query(
        "UPDATE scan_jobs SET status = 'failed' WHERE scan_job_id = $1",
        [scanJobId]
      );
      return;
    }

    const scan = await res.json();

    const charge  = calculateNairaCharge(scan.flagged_word_count);
    const credits = nairaToCredits(charge);

    let verdict    = scan.flagged_sections === 0 ? "clean" : "flagged";
    let costLine   = null;
    let issueLines = [];

    if (scan.flagged_sections > 0) {
      costLine = `${scan.flagged_sections} section${scan.flagged_sections === 1 ? "" : "s"} need${scan.flagged_sections === 1 ? "s" : ""} fixing — ₦${charge.toLocaleString()}`;
      const { ai_written, web_plagiarism, academic, internal_copy } = scan.issues;
      if (ai_written > 0)     issueLines.push(`${ai_written} section${ai_written > 1 ? "s" : ""} detected as AI-written`);
      if (web_plagiarism > 0) issueLines.push(`${web_plagiarism} section${web_plagiarism > 1 ? "s" : ""} matched content found online`);
      if (academic > 0)       issueLines.push(`${academic} section${academic > 1 ? "s" : ""} matched academic sources`);
      if (internal_copy > 0)  issueLines.push(`${internal_copy} section${internal_copy > 1 ? "s" : ""} repeated too closely within the document`);
    }

    const result = {
      verdict,
      costLine,
      issueLines,
      totalSections:   scan.total_paragraphs,
      flaggedSections: scan.flagged_sections,
      _detail: {
        flaggedWords: scan.flagged_word_count,
        totalWords:   scan.total_word_count,
        chargeNaira:  charge,
        issues:       scan.issues,
      },
      _internal: {
        credits_needed: credits,
      },
    };

    await pool.query(
      "UPDATE scan_jobs SET status = 'done', result = $1 WHERE scan_job_id = $2",
      [JSON.stringify(result), scanJobId]
    );
  } catch (err) {
    console.error("[scan/background]", err);
    await pool.query(
      "UPDATE scan_jobs SET status = 'failed' WHERE scan_job_id = $1",
      [scanJobId]
    ).catch(() => {});
  }
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

    // Create a scan job record
    const record = await pool.query(
      "INSERT INTO scan_jobs (scan_job_id, status) VALUES (gen_random_uuid(), 'processing') RETURNING scan_job_id"
    );
    const scanJobId = record.rows[0].scan_job_id;

    // Keep function alive for background task
    waitUntil(
      _runPrescanInBackground({ scanJobId, fileBuffer: buffer, fileName: file.name })
    );

    return NextResponse.json({ scanJobId, status: "processing" });

  } catch (err) {
    console.error("[document/scan]", err);
    return NextResponse.json({ error: "Could not start scan. Please try again." }, { status: 500 });
  }
}