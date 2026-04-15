export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL || "https://projekkt.shaddies.space";

// ── Credit bundles ────────────────────────────────────────────────────────────
export const CREDIT_BUNDLES = {
  starter:  { name: "Starter",  amount: 2000,  credits: 2000,  bonus: 0    },
  standard: { name: "Standard", amount: 5000,  credits: 5500,  bonus: 500  },
  pro:      { name: "Pro",      amount: 10000, credits: 12000, bonus: 2000 },
  studio:   { name: "Studio",   amount: 20000, credits: 26000, bonus: 6000 },
};

export async function POST(request) {
  try {
    await initDB();
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { bundle } = await request.json();
    const bundleConfig = CREDIT_BUNDLES[bundle];
    if (!bundleConfig) return NextResponse.json({ error: "Invalid bundle." }, { status: 400 });

    const userResult = await pool.query("SELECT id, email FROM users WHERE id = $1", [user.userId]);
    const dbUser     = userResult.rows[0];
    if (!dbUser) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const txRef = `projekkt-credits-${user.userId}-${Date.now()}`;

    await pool.query(
      "INSERT INTO payments (user_id, flutterwave_ref, amount, currency, bundle_type, credits_purchased, status) VALUES ($1, $2, $3, 'NGN', $4, $5, 'pending')",
      [user.userId, txRef, bundleConfig.amount, bundle, bundleConfig.credits]
    );

    const flwRes = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${FLW_SECRET_KEY}` },
      body: JSON.stringify({
        tx_ref:          txRef,
        amount:          bundleConfig.amount,
        currency:        "NGN",
        redirect_url:    `${APP_URL}/payment/callback`,
        customer:        { email: dbUser.email },
        payment_options: "card,banktransfer,ussd",
        customizations:  {
          title:       "Projekkt Credits",
          description: `${bundleConfig.name} — ${bundleConfig.credits.toLocaleString()} credits`,
          logo:        `${APP_URL}/favicon.svg`,
        },
        meta: { user_id: user.userId, bundle, credits: bundleConfig.credits, expected_amount: bundleConfig.amount },
      }),
    });

    const flwData = await flwRes.json();
    if (flwData.status !== "success") {
      console.error("[credits/topup flw error]", JSON.stringify(flwData));
      return NextResponse.json({ error: flwData.message || "Could not initiate payment." }, { status: 502 });
    }

    return NextResponse.json({ paymentUrl: flwData.data.link, txRef, credits: bundleConfig.credits });
  } catch (err) {
    console.error("[credits/topup]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
