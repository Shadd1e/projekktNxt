export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  try {
    await initDB();
    const auth = getUserFromRequest(request);
    if (!auth) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const result = await pool.query(
      "SELECT id, email, credits FROM users WHERE id = $1",
      [auth.userId]
    );
    if (result.rows.length === 0)
      return NextResponse.json({ error: "User not found." }, { status: 404 });

    return NextResponse.json({ user: result.rows[0] });
  } catch (err) {
    console.error("[auth/me]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
