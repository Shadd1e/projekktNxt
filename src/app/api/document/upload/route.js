export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { sendDocumentReady } from "@/lib/email";

const PYTHON_SERVICE_URL   = process.env.PYTHON_SERVICE_URL;
const INTERNAL_API_SECRET  = process.env.INTERNAL_API_SECRET;
const MAX_FILE_SIZE        = 10 * 1024 * 1024;
const CREDIT_COST_PER_WORD = 0.5;

async function _processInBackground({ jobId, userId, userEmail, fileBuffer, fileName, creditsNeeded }) {
  try {
    const pythonForm = new FormData();
    pythonForm.append(
      "file",
      new Blob([fileBuffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
      fileName
    );
    const pythonRes = await fetch(`${PYTHON_SERVICE_URL}/process`, {
      method: "POST", headers: { "x-internal-secret": INTERNAL_API_SECRET }, body: pythonForm,
    });

    if (!pythonRes.ok) {
      await pool.query("UPDATE jobs SET status = 'failed' WHERE job_id = $1", [jobId]);
      return;
    }

    const { job_id: pythonJobId, report } = await pythonRes.json();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("UPDATE users SET credits = credits - $1 WHERE id = $2", [creditsNeeded, userId]);
      await client.query(
        "INSERT INTO credit_log (user_id, delta, reason, ref) VALUES ($1, $2, 'document_scan', $3)",
        [userId, -creditsNeeded, pythonJobId]
      );
      await client.query(
        "UPDATE jobs SET status = 'done', report = $1, job_id = $2 WHERE job_id = $3",
        [JSON.stringify(report), pythonJobId, jobId]
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      await pool.query("UPDATE jobs SET status = 'failed' WHERE job_id = $1", [jobId]).catch(() => {});
      throw e;
    } finally {
      client.release();
    }

    sendDocumentReady(userEmail, pythonJobId).catch(console.error);
  } catch (err) {
    console.error("[upload/background]", err);
    await pool.query("UPDATE jobs SET status = 'failed' WHERE job_id = $1", [jobId]).catch(() => {});
  }
}

export async function POST(request) {
  try {
    await initDB();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const userResult = await pool.query("SELECT id, email, credits FROM users WHERE id = $1", [user.userId]);
    const dbUser     = userResult.rows[0];

    if (!dbUser || dbUser.credits < 500)
      return NextResponse.json({ error: "Insufficient credits. Please top up to continue." }, { status: 403 });

    const formData = await request.formData();
    const file     = formData.get("file");

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!file.name.endsWith(".docx")) return NextResponse.json({ error: "Only .docx files are accepted." }, { status: 400 });

    const fileBuffer = await file.arrayBuffer();
    if (fileBuffer.byteLength > MAX_FILE_SIZE) return NextResponse.json({ error: "File exceeds 10MB limit." }, { status: 400 });

    const magic   = new Uint8Array(fileBuffer.slice(0, 4));
    const isPKzip = magic[0] === 0x50 && magic[1] === 0x4B && magic[2] === 0x03 && magic[3] === 0x04;
    if (!isPKzip) return NextResponse.json({ error: "Invalid file format. Only genuine .docx files are accepted." }, { status: 400 });

    // Quick scan to determine credit cost
    const scanForm = new FormData();
    scanForm.append("file", new Blob([fileBuffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }), file.name);
    const scanRes       = await fetch(`${PYTHON_SERVICE_URL}/analyse`, {
      method: "POST", headers: { "x-internal-secret": INTERNAL_API_SECRET }, body: scanForm,
    });
    const scanData      = scanRes.ok ? await scanRes.json() : { word_count: 0 };
    const creditsNeeded = Math.max(Math.ceil(scanData.word_count * CREDIT_COST_PER_WORD), 500);

    if (dbUser.credits < creditsNeeded)
      return NextResponse.json({
        error: `This document requires ${creditsNeeded.toLocaleString()} credits. You have ${dbUser.credits.toLocaleString()}. Please top up.`,
        credits_needed: creditsNeeded, credits_available: dbUser.credits,
      }, { status: 403 });

    // Create job record and return immediately — Python runs in background
    const jobRecord = await pool.query(
      "INSERT INTO jobs (user_id, job_id, status, credits_used) VALUES ($1, gen_random_uuid(), 'processing', $2) RETURNING job_id",
      [user.userId, creditsNeeded]
    );
    const jobId = jobRecord.rows[0].job_id;

    _processInBackground({
      jobId, userId: user.userId, userEmail: dbUser.email,
      fileBuffer, fileName: file.name, creditsNeeded,
    }).catch(console.error);

    return NextResponse.json({ jobId, status: "processing", credits_used: creditsNeeded });
  } catch (err) {
    console.error("[document/upload]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
