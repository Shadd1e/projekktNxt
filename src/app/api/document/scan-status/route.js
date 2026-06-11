export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";

export async function GET(request) {
  try {
    await initDB();

    const { searchParams } = new URL(request.url);
    const scanJobId = searchParams.get("scanJobId");
    if (!scanJobId)
      return NextResponse.json({ error: "scanJobId is required." }, { status: 400 });

    const result = await pool.query(
      "SELECT status, result FROM scan_jobs WHERE scan_job_id = $1",
      [scanJobId]
    );

    if (result.rows.length === 0)
      return NextResponse.json({ error: "Scan job not found." }, { status: 404 });

    const row = result.rows[0];

    if (row.status === "done") {
      return NextResponse.json({ status: "done", result: row.result });
    }

    return NextResponse.json({ status: row.status });

  } catch (err) {
    console.error("[document/scan-status]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
