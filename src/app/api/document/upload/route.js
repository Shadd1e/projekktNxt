export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { sendDocumentReady } from "@/lib/email";
import { calculateNairaCharge, nairaToCredits } from "@/app/api/document/scan/route";

const PYTHON_SERVICE_URL  = process.env.PYTHON_SERVICE_URL;
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
const MAX_FILE_SIZE       = 10 * 1024 * 1024;

async function _processInBackground({ jobId, userId, userEmail, fileBuffer, fileName }) {
  try {
    // Step 1: Run prescan to determine credits needed
    const scanForm = new FormData();
    scanForm.append(
      "file",
      new Blob([fileBuffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
      fileName
    );

    let creditsNeeded = 0;
    const scanRes = await fetch(`${PYTHON_SERVICE_URL}/prescan`, {
      method:  "POST",
      headers: { "x-internal-secret": INTERNAL_API_SECRET },
      body:    scanForm,
    });

    if (scanRes.ok) {
      const scanData = await scanRes.json();
      const charge   = calculateNairaCharge(scanData.flagged_word_count ?? 0);
      creditsNeeded  = nairaToCredits(charge);
    }

    // Step 2: Deduct credits (with row lock to prevent race conditions)
    const dbClient = await pool.connect();
    try {
      await dbClient.query("BEGIN");

      if (creditsNeeded > 0) {
        const locked = await dbClient.query(
          "SELECT credits FROM users WHERE id = $1 FOR UPDATE",
          [userId]
        );
        const current = locked.rows[0]?.credits ?? 0;

        if (current < creditsNeeded) {
          await dbClient.query("ROLLBACK");
          await pool.query(
            "UPDATE jobs SET status = 'failed', fail_reason = 'insufficient_credits' WHERE job_id = $1",
            [jobId]
          );
          return;
        }

        await dbClient.query(
          "UPDATE users SET credits = credits - $1 WHERE id = $2",
          [creditsNeeded, userId]
        );
        await dbClient.query(
          "INSERT INTO credit_log (user_id, delta, reason) VALUES ($1, $2, 'document_fix')",
          [userId, -creditsNeeded]
        );
      }

      // Update job with the credits amount now we know it
      await dbClient.query(
        "UPDATE jobs SET credits_used = $1 WHERE job_id = $2",
        [creditsNeeded, jobId]
      );

      await dbClient.query("COMMIT");
    } catch (e) {
      await dbClient.query("ROLLBACK");
      await pool.query("UPDATE jobs SET status = 'failed' WHERE job_id = $1", [jobId]).catch(() => {});
      throw e;
    } finally {
      dbClient.release();
    }

    // Step 3: Send to Python for full processing
    const pythonForm = new FormData();
    pythonForm.append(
      "file",
      new Blob([fileBuffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
      fileName
    );

    const pythonRes = await fetch(`${PYTHON_SERVICE_URL}/process`, {
      method:  "POST",
      headers: { "x-internal-secret": INTERNAL_API_SECRET },
      body:    pythonForm,
    });

    if (!pythonRes.ok) {
      await pool.query("UPDATE jobs SET status = 'failed' WHERE job_id = $1", [jobId]);
      return;
    }

    const { job_id: pythonJobId, report } = await pythonRes.json();

    await pool.query(
      "UPDATE jobs SET status = 'done', report = $1, job_id = $2 WHERE job_id = $3",
      [JSON.stringify(report), pythonJobId, jobId]
    );

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

    const formData = await request.formData();
    const file     = formData.get("file");

    if (!file)
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!file.name.endsWith(".docx"))
      return NextResponse.json({ error: "Only .docx files are accepted." }, { status: 400 });

    const fileBuffer = await file.arrayBuffer();
    if (fileBuffer.byteLength > MAX_FILE_SIZE)
      return NextResponse.json({ error: "File exceeds 10MB limit." }, { status: 400 });

    // Verify PK magic bytes — must be a real docx/zip
    const magic   = new Uint8Array(fileBuffer.slice(0, 4));
    const isPKzip = magic[0] === 0x50 && magic[1] === 0x4B && magic[2] === 0x03 && magic[3] === 0x04;
    if (!isPKzip)
      return NextResponse.json({ error: "Invalid file. Only genuine .docx files are accepted." }, { status: 400 });

    const userRow = await pool.query("SELECT id, email, credits FROM users WHERE id = $1", [user.userId]);
    const dbUser  = userRow.rows[0];
    if (!dbUser) return NextResponse.json({ error: "User not found." }, { status: 404 });

    // Quick balance sanity check — exact check happens in background with row lock
    if ((dbUser.credits || 0) < 250) {
      return NextResponse.json({
        error: `You need at least ₦250 credits to process a document. Your balance is ₦${(dbUser.credits || 0).toLocaleString()}. Please top up to continue.`,
        shortfall: 250 - (dbUser.credits || 0),
      }, { status: 403 });
    }

    const jobRecord = await pool.query(
      "INSERT INTO jobs (user_id, job_id, status, credits_used) VALUES ($1, gen_random_uuid(), 'processing', 0) RETURNING job_id",
      [user.userId]
    );
    const jobId = jobRecord.rows[0].job_id;

    // Fire and forget — prescan + process happens in background
    _processInBackground({
      jobId,
      userId:    user.userId,
      userEmail: dbUser.email,
      fileBuffer,
      fileName:  file.name,
    }).catch(console.error);

    return NextResponse.json({
      jobId,
      status: "processing",
    });

  } catch (err) {
    console.error("[document/upload]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
