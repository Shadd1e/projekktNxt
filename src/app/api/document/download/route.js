export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import pool from "@/lib/db";

const PYTHON_SERVICE_URL  = process.env.PYTHON_SERVICE_URL;
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) return NextResponse.json({ error: "Job ID is required." }, { status: 400 });

    // Verify this job belongs to this user
    const jobResult = await pool.query(
      "SELECT job_id, status, expires_at FROM jobs WHERE job_id = $1 AND user_id = $2",
      [jobId, user.userId]
    );
    if (jobResult.rows.length === 0)
      return NextResponse.json({ error: "Job not found." }, { status: 404 });

    const job = jobResult.rows[0];
    if (job.expires_at && new Date(job.expires_at) < new Date())
      return NextResponse.json({ error: "File has expired and been deleted." }, { status: 410 });

    // Proxy download from Python service
    const pythonRes = await fetch(`${PYTHON_SERVICE_URL}/download/${jobId}`, {
      headers: { "x-internal-secret": INTERNAL_API_SECRET },
    });

    if (!pythonRes.ok) {
      const errData = await pythonRes.json().catch(() => ({}));
      return NextResponse.json({ error: errData.detail || "File not found or already expired." }, { status: 404 });
    }

    const blob    = await pythonRes.arrayBuffer();
    const headers = new Headers({
      "Content-Type":        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=\"corrected_document.docx\"",
    });

    return new NextResponse(blob, { status: 200, headers });
  } catch (err) {
    console.error("[document/download]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
