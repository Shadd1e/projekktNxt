export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendPaymentConfirmation } from "@/lib/email";

const FLW_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH;
const FLW_SECRET_KEY  = process.env.FLUTTERWAVE_SECRET_KEY;

export async function POST(request) {
  try {
    const signature = request.headers.get("verif-hash");
    if (!signature || signature !== FLW_SECRET_HASH)
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

    const event = await request.json();
    if (event.event !== "charge.completed")
      return NextResponse.json({ message: "Event ignored." });

    const { tx_ref, status, id: flw_id } = event.data;

    if (status !== "successful") {
      await pool.query("UPDATE payments SET status = 'failed' WHERE flutterwave_ref = $1", [tx_ref]);
      return NextResponse.json({ message: "Payment not successful." });
    }

    // Verify with Flutterwave directly
    const verifyRes  = await fetch(`https://api.flutterwave.com/v3/transactions/${flw_id}/verify`, {
      headers: { "Authorization": `Bearer ${FLW_SECRET_KEY}` },
    });
    const verifyData = await verifyRes.json();
    if (verifyData.data?.status !== "successful")
      return NextResponse.json({ message: "Verification failed." });

    const payResult = await pool.query(
      "SELECT id, user_id, bundle_type, credits_purchased, amount, status FROM payments WHERE flutterwave_ref = $1",
      [tx_ref]
    );
    if (payResult.rows.length === 0)
      return NextResponse.json({ message: "Payment record not found." });

    const payment = payResult.rows[0];
    if (payment.status === "completed")
      return NextResponse.json({ message: "Already processed." });

    // Exact amount check
    const expectedAmount = parseFloat(payment.amount);
    const actualAmount   = parseFloat(verifyData.data.amount);
    if (actualAmount < expectedAmount) {
      await pool.query("UPDATE payments SET status = 'underpaid' WHERE flutterwave_ref = $1", [tx_ref]);
      console.warn(`[webhook] Underpayment: expected ₦${expectedAmount}, got ₦${actualAmount}`);
      return NextResponse.json({ message: "Underpayment detected." });
    }

    // Add credits to user
    const credits = payment.credits_purchased;
    await pool.query("UPDATE payments SET status = 'completed' WHERE flutterwave_ref = $1", [tx_ref]);
    await pool.query("UPDATE users SET credits = credits + $1 WHERE id = $2", [credits, payment.user_id]);
    await pool.query(
      "INSERT INTO credit_log (user_id, delta, reason, ref) VALUES ($1, $2, 'topup', $3)",
      [payment.user_id, credits, tx_ref]
    );

    // Send confirmation email
    const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [payment.user_id]);
    if (userResult.rows[0])
      sendPaymentConfirmation(userResult.rows[0].email, payment.bundle_type, credits).catch(console.error);

    return NextResponse.json({ message: "Credits added successfully." });
  } catch (err) {
    console.error("[payment/webhook]", err);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
