import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { sendDocumentReady } from "@/lib/email";

const PYTHON_SERVICE_URL  = process.env.PYTHON_SERVICE_URL;
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
const MAX_FILE_SIZE       = 10 * 1024 * 1024; // 10MB

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    // Verify paid status from DB
    const userResult = await pool.query(
      "SELECT id, email, is_paid, plan_type, plan_expires_at FROM users WHERE id = $1",
      [user.userId]
    );
    const dbUser = userResult.rows[0];
    if (!dbUser?.is_paid)
      return NextResponse.json({ error: "Please purchase a plan to use this feature." }, { status: 403 });

    if (dbUser.plan_expires_at && new Date(dbUser.plan_expires_at) < new Date()) {
      await pool.query("UPDATE users SET is_paid = FALSE, plan_type = 'none' WHERE id = $1", [user.userId]);
      return NextResponse.json({ error: "Your plan has expired. Please renew to continue." }, { status: 403 });
    }

    const formData = await request.formData();
    const file     = formData.get("file");

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!file.name.endsWith(".docx"))
      return NextResponse.json({ error: "Only .docx files are accepted." }, { status: 400 });

    const fileBuffer = await file.arrayBuffer();
    if (fileBuffer.byteLength > MAX_FILE_SIZE)
      return NextResponse.json({ error: "File exceeds 10MB limit." }, { status: 400 });

    // Create job record
    const jobRecord = await pool.query(
      "INSERT INTO jobs (user_id, job_id, status) VALUES ($1, gen_random_uuid(), 'processing') RETURNING job_id",
      [user.userId]
    );
    const jobId = jobRecord.rows[0].job_id;

    // Forward to Python microservice
    const pythonForm = new FormData();
    pythonForm.append(
      "file",
      new Blob([fileBuffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
      file.name
    );

    const pythonRes = await fetch(`${PYTHON_SERVICE_URL}/process`, {
      method:  "POST",
      headers: { "x-internal-secret": INTERNAL_API_SECRET },
      body:    pythonForm,
    });

    if (!pythonRes.ok) {
      const errData = await pythonRes.json().catch(() => ({}));
      await pool.query("UPDATE jobs SET status = 'failed' WHERE job_id = $1", [jobId]);
      return NextResponse.json({ error: errData.detail || "Processing failed. Please try again." }, { status: 502 });
    }

    const { job_id: pythonJobId, report } = await pythonRes.json();

    // Update job with python job ID and report
    await pool.query(
      "UPDATE jobs SET status = 'done', report = $1, job_id = $2 WHERE job_id = $3",
      [JSON.stringify(report), pythonJobId, jobId]
    );

    // Deduct per_doc credit
    if (dbUser.plan_type === "per_doc") {
      await pool.query("UPDATE users SET is_paid = FALSE, plan_type = 'none' WHERE id = $1", [user.userId]);
    }

    // Send email notification (non-blocking)
    sendDocumentReady(dbUser.email, pythonJobId).catch(console.error);

    return NextResponse.json({ jobId: pythonJobId, report, status: "done" });
  } catch (err) {
    console.error("[document/upload]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
