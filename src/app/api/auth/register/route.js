export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendVerificationCode } from "@/lib/email";

export async function POST(request) {
  try {
    await initDB();

    const { email, password } = await request.json();

    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

    const hash   = await hashPassword(password);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [email.toLowerCase(), hash]
    );
    const user = result.rows[0];

    const code      = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query(
      "INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)",
      [user.id, code, expiresAt]
    );

    // Send email — non-fatal. If Brevo fails, user can still proceed to verify page
    // and request a resend. We log the error but don't crash the registration.
    let emailSent = true;
    try {
      await sendVerificationCode(user.email, code);
    } catch (emailErr) {
      emailSent = false;
      console.error("[register] Email failed:", emailErr.message);
    }

    return NextResponse.json({
      message: emailSent
        ? "Account created. Check your email for a verification code."
        : "Account created. Email delivery failed — use the resend option on the next page.",
      userId: user.id,
      emailSent,
    });

  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
