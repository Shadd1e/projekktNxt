export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { sendDocumentReady } from "@/lib/email";
import { calculateNairaCharge, nairaToCredits } from "@/app/api/document/scan/route";

const PYTHON_SERVICE_URL  = process.env.PYTHON_SERVICE_URL;
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
const MAX_FILE_SIZE       = 10 * 1024 * 1024;

async function _processInBackground({ jobId, userId, userEmail, fileBuffer, fileName, creditsNeeded }) {
  try {
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

    // Deduct credits inside a transaction with a row-level lock.
    // SELECT FOR UPDATE prevents two simultaneous jobs both passing
    // the balance check and both deducting.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (creditsNeeded > 0) {
        const locked = await client.query(
          "SELECT credits FROM users WHERE id = $1 FOR UPDATE",
          [userId]
        );
        const current = locked.rows[0]?.credits ?? 0;

        if (current < creditsNeeded) {
          await client.query("ROLLBACK");
          await pool.query(
            "UPDATE jobs SET status = 'failed', fail_reason = 'insufficient_credits' WHERE job_id = $1",
            [jobId]
          );
          return;
        }

        await client.query(
          "UPDATE users SET credits = credits - $1 WHERE id = $2",
          [creditsNeeded, userId]
        );
        await client.query(
          "INSERT INTO credit_log (user_id, delta, reason, ref) VALUES ($1, $2, 'document_fix', $3)",
          [userId, -creditsNeeded, pythonJobId]
        );
      }

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

    // Run prescan to find out exactly how many words need rewriting.
    // Only those words are charged — not the full document.
    const scanForm = new FormData();
    scanForm.append(
      "file",
      new Blob([fileBuffer], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
      file.name
    );

    const scanRes = await fetch(`${PYTHON_SERVICE_URL}/prescan`, {
      method:  "POST",
      headers: { "x-internal-secret": INTERNAL_API_SECRET },
      body:    scanForm,
    });

    let creditsNeeded = 0;
    if (scanRes.ok) {
      const scanData = await scanRes.json();
      const charge   = calculateNairaCharge(scanData.flagged_word_count ?? 0);
      creditsNeeded  = nairaToCredits(charge);
    }

    // Pre-deduction balance check
    if (creditsNeeded > 0) {
      const userResult = await pool.query(
        "SELECT id, email, credits FROM users WHERE id = $1",
        [user.userId]
      );
      const dbUser = userResult.rows[0];
      if (!dbUser) return NextResponse.json({ error: "User not found." }, { status: 404 });

      if (dbUser.credits < creditsNeeded) {
        const shortfall = creditsNeeded - dbUser.credits;
        return NextResponse.json({
          error:        `You need ₦${creditsNeeded.toLocaleString()} to fix this document. Your balance is ₦${dbUser.credits.toLocaleString()}. Please top up ₦${shortfall.toLocaleString()} to continue.`,
          shortfall,
          charge_naira: creditsNeeded,
        }, { status: 403 });
      }
    }

    const userRow = await pool.query("SELECT id, email FROM users WHERE id = $1", [user.userId]);
    const dbUser  = userRow.rows[0];
    if (!dbUser) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const jobRecord = await pool.query(
      "INSERT INTO jobs (user_id, job_id, status, credits_used) VALUES ($1, gen_random_uuid(), 'processing', $2) RETURNING job_id",
      [user.userId, creditsNeeded]
    );
    const jobId = jobRecord.rows[0].job_id;

    _processInBackground({
      jobId,
      userId:    user.userId,
      userEmail: dbUser.email,
      fileBuffer,
      fileName:  file.name,
      creditsNeeded,
    }).catch(console.error);

    return NextResponse.json({
      jobId,
      status:       "processing",
      charge_naira: creditsNeeded,
      is_free:      creditsNeeded === 0,
    });

  } catch (err) {
    console.error("[document/upload]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
