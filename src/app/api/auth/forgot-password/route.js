export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";
import { sendPasswordReset } from "@/lib/email";
import crypto from "crypto";

export async function POST(request) {
  try {
    await initDB();
    const { email } = await request.json();

    if (!email)
      return NextResponse.json({ error: "Email is required." }, { status: 400 });

    // Always return the same response regardless of whether the email exists.
    // This prevents user enumeration attacks.
    const SAFE_RESPONSE = NextResponse.json({
      message: "If an account with that email exists, a reset link has been sent.",
    });

    const result = await pool.query(
      "SELECT id, email FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) return SAFE_RESPONSE;

    const user  = result.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token — delete any existing one for this user first
    await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, token, expiresAt]
    );

    try {
      await sendPasswordReset(user.email, token);
    } catch (emailErr) {
      console.error("[forgot-password] Email failed:", emailErr.message);
      // Still return the safe response — don't leak whether email exists
    }

    return SAFE_RESPONSE;
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
