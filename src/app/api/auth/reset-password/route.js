export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request) {
  try {
    await initDB();
    const { token, password } = await request.json();

    if (!token || !password)
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    // Look up the token
    const result = await pool.query(
      "SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1",
      [token]
    );

    if (result.rows.length === 0)
      return NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 });

    const { user_id, expires_at } = result.rows[0];

    if (new Date() > new Date(expires_at))
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });

    // Update password and delete the used token
    const hash = await hashPassword(password);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, user_id]);
      await client.query("DELETE FROM password_reset_tokens WHERE token = $1", [token]);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    return NextResponse.json({ message: "Password updated. You can now log in." });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
