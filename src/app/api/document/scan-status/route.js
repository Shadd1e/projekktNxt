export const dynamic    = 'force-dynamic';
export const maxDuration = 10; // just a DB read + one fast Railway status call

import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";

const NAIRA_PER_WORD = 0.5;
const MIN_CHARGE     = 250;

function calculateNairaCharge(flaggedWordCount) {
  if (flaggedWordCount === 0) return 0;
  const raw = Math.ceil(flaggedWordCount * NAIRA_PER_WORD);
  return Math.max(raw, MIN_CHARGE);
}

export async function GET(request) {
  try {
    await initDB();

    const { searchParams } = new URL(request.url);
    const scanJobId = searchParams.get("scanJobId");
    if (!scanJobId)
      return NextResponse.json({ error: "scanJobId is required." }, { status: 400 });

    const dbResult = await pool.query(
      "SELECT status, result, railway_job_id FROM scan_jobs WHERE scan_job_id = $1",
      [scanJobId]
    );

    if (dbResult.rows.length === 0)
      return NextResponse.json({ error: "Scan job not found." }, { status: 404 });

    const row = dbResult.rows[0];

    // Already resolved — return from DB (no Railway call needed)
    if (row.status === "done")
      return NextResponse.json({ status: "done", result: row.result });

    if (row.status === "failed")
      return NextResponse.json({ status: "failed" });

    // Still processing — ask Railway for current status
    const PYTHON_SERVICE_URL  = process.env.PYTHON_SERVICE_URL;
    const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

    if (!row.railway_job_id) {
      // Shouldn't happen, but guard anyway
      return NextResponse.json({ status: "processing" });
    }

    let railwayStatus;
    try {
      const res = await fetch(
        `${PYTHON_SERVICE_URL}/job-status/${row.railway_job_id}`,
        {
          headers: { "x-internal-secret": INTERNAL_API_SECRET },
          signal:  AbortSignal.timeout(8_000),
        }
      );
      railwayStatus = await res.json();
    } catch {
      // Railway temporarily unreachable — tell frontend to keep polling
      return NextResponse.json({ status: "processing" });
    }

    if (railwayStatus.status === "processing") {
      return NextResponse.json({ status: "processing" });
    }

    if (railwayStatus.status === "failed") {
      await pool.query(
        "UPDATE scan_jobs SET status = 'failed' WHERE scan_job_id = $1",
        [scanJobId]
      );
      return NextResponse.json({ status: "failed" });
    }

    if (railwayStatus.status === "done") {
      // Build the result object (same shape the frontend expects)
      const scan   = railwayStatus.result;
      const charge = calculateNairaCharge(scan.flagged_word_count);

      let verdict    = scan.flagged_sections === 0 ? "clean" : "flagged";
      let costLine   = null;
      let issueLines = [];

      if (scan.flagged_sections > 0) {
        costLine = `${scan.flagged_sections} section${scan.flagged_sections === 1 ? "" : "s"} need${scan.flagged_sections === 1 ? "s" : ""} fixing — ₦${charge.toLocaleString()}`;
        const { ai_written, web_plagiarism, academic, internal_copy } = scan.issues;
        if (ai_written     > 0) issueLines.push(`${ai_written} section${ai_written > 1 ? "s" : ""} detected as AI-written`);
        if (web_plagiarism > 0) issueLines.push(`${web_plagiarism} section${web_plagiarism > 1 ? "s" : ""} matched content found online`);
        if (academic       > 0) issueLines.push(`${academic} section${academic > 1 ? "s" : ""} matched academic sources`);
        if (internal_copy  > 0) issueLines.push(`${internal_copy} section${internal_copy > 1 ? "s" : ""} repeated too closely within the document`);
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
          credits_needed: charge,
        },
      };

      // Persist result so future polls are served from DB (no Railway call)
      await pool.query(
        "UPDATE scan_jobs SET status = 'done', result = $1 WHERE scan_job_id = $2",
        [JSON.stringify(result), scanJobId]
      );

      return NextResponse.json({ status: "done", result });
    }

    // Fallback — shouldn't reach here
    return NextResponse.json({ status: "processing" });

  } catch (err) {
    console.error("[document/scan-status]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
