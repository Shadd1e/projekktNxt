export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    await initDB();
    const { email, password } = await request.json();
    if (!email || !password)
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

    const result = await pool.query(
      "SELECT id, email, password_hash, is_verified, credits FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (result.rows.length === 0)
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    const user  = result.rows[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid)
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    if (!user.is_verified)
      return NextResponse.json(
        { error: "Please verify your email before logging in.", userId: user.id, needsVerification: true },
        { status: 403 }
      );

    const token = signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      message: "Login successful.",
      token,
      user: { id: user.id, email: user.email, credits: user.credits },
    });

    response.cookies.set("projekkt_token", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });

    return response;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
