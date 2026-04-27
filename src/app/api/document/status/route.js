export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  try {
    await initDB();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    if (!jobId) return NextResponse.json({ error: "jobId is required." }, { status: 400 });

    const result = await pool.query(
      "SELECT status, credits_used, report FROM jobs WHERE job_id = $1 AND user_id = $2",
      [jobId, user.userId]
    );
    if (result.rows.length === 0)
      return NextResponse.json({ error: "Job not found." }, { status: 404 });

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("[document/status]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
