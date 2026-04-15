export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    await initDB();
    const { userId, code } = await request.json();
    if (!userId || !code)
      return NextResponse.json({ error: "User ID and code are required." }, { status: 400 });

    const result = await pool.query(
      "SELECT id, code, expires_at, used FROM verification_codes WHERE user_id = $1 AND used = FALSE ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    if (result.rows.length === 0)
      return NextResponse.json({ error: "No verification code found." }, { status: 400 });

    const record = result.rows[0];
    if (record.used)
      return NextResponse.json({ error: "This code has already been used." }, { status: 400 });
    if (new Date(record.expires_at) < new Date())
      return NextResponse.json({ error: "This code has expired. Please request a new one." }, { status: 400 });
    if (record.code !== code.trim())
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });

    await pool.query("UPDATE verification_codes SET used = TRUE WHERE id = $1", [record.id]);
    await pool.query("UPDATE users SET is_verified = TRUE WHERE id = $1", [userId]);

    const userResult = await pool.query("SELECT id, email, credits FROM users WHERE id = $1", [userId]);
    const user  = userResult.rows[0];
    const token = signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      message: "Email verified successfully.",
      token,
      user: { id: user.id, email: user.email, credits: user.credits },
    });

    response.cookies.set("projekkt_token", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/",
    });

    return response;
  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "User ID is required." }, { status: 400 });

    const userResult = await pool.query("SELECT id, email, is_verified FROM users WHERE id = $1", [userId]);
    if (userResult.rows.length === 0) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (userResult.rows[0].is_verified) return NextResponse.json({ error: "Already verified." }, { status: 400 });

    const code      = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query("INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1, $2, $3)", [userId, code, expiresAt]);

    const { sendVerificationCode } = await import("@/lib/email");
    await sendVerificationCode(userResult.rows[0].email, code);
    return NextResponse.json({ message: "A new code has been sent." });
  } catch (err) {
    console.error("[verify/resend]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
