export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool, { initDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const FLW_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL || "https://projekkt.shaddies.space";

const FIXED_PLANS = {
  weekly:  { name: "Projekkt — Weekly Unlimited",  amount: 7000,  currency: "NGN", duration_days: 7  },
  monthly: { name: "Projekkt — Monthly Unlimited", amount: 20000, currency: "NGN", duration_days: 30 },
};

export async function POST(request) {
  try {
    await initDB();

    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const body                      = await request.json();
    const { plan, amount: clientAmount } = body;

    if (!plan) return NextResponse.json({ error: "Plan is required." }, { status: 400 });

    const userResult = await pool.query("SELECT id, email FROM users WHERE id = $1", [user.userId]);
    const dbUser     = userResult.rows[0];
    if (!dbUser) return NextResponse.json({ error: "User not found." }, { status: 404 });

    let planConfig;

    if (plan === "per_doc") {
      if (!clientAmount || clientAmount < 500)
        return NextResponse.json({ error: "Invalid document price." }, { status: 400 });
      if (clientAmount > 10000)
        return NextResponse.json({ error: "Document too large for per-doc plan. Please use Weekly or Monthly." }, { status: 400 });

      planConfig = { name: "Projekkt — Per Document", amount: clientAmount, currency: "NGN", duration_days: null };
    } else {
      planConfig = FIXED_PLANS[plan];
      if (!planConfig) return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const txRef = `projekkt-${user.userId}-${Date.now()}`;

    await pool.query(
      "INSERT INTO payments (user_id, flutterwave_ref, amount, currency, plan_type, status) VALUES ($1, $2, $3, $4, $5, 'pending')",
      [user.userId, txRef, planConfig.amount, planConfig.currency, plan]
    );

    const flwRes = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${FLW_SECRET_KEY}` },
      body: JSON.stringify({
        tx_ref:          txRef,
        amount:          planConfig.amount,
        currency:        planConfig.currency,
        redirect_url:    `${APP_URL}/payment/callback`,
        customer:        { email: dbUser.email },
        payment_options: "card,banktransfer,ussd",
        customizations:  { title: "Projekkt", description: planConfig.name, logo: `${APP_URL}/logo.svg` },
        meta:            { plan_type: plan, user_id: user.userId, expected_amount: planConfig.amount },
      }),
    });

    const flwData = await flwRes.json();
    if (flwData.status !== "success")
      return NextResponse.json({ error: "Could not initiate payment. Please try again." }, { status: 502 });

    return NextResponse.json({ paymentUrl: flwData.data.link, txRef, amount: planConfig.amount });
  } catch (err) {
    console.error("[payment/initiate]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
