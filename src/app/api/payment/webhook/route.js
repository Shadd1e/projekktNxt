export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendPaymentConfirmation } from "@/lib/email";

const FLW_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH || process.env.FLUTTERWAVE_SECRET_KEY;
const FLW_SECRET_KEY  = process.env.FLUTTERWAVE_SECRET_KEY;

const PLAN_DURATIONS = { per_doc: null, weekly: 7, monthly: 30 };

export async function POST(request) {
  try {
    const signature = request.headers.get("verif-hash");
    if (!signature || signature !== FLW_SECRET_HASH)
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

    const event = await request.json();
    if (event.event !== "charge.completed")
      return NextResponse.json({ message: "Event ignored." });

    const { tx_ref, status, id: flw_id, amount: paid_amount } = event.data;

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

    // Get payment record
    const payResult = await pool.query(
      "SELECT id, user_id, plan_type, amount, status FROM payments WHERE flutterwave_ref = $1",
      [tx_ref]
    );
    if (payResult.rows.length === 0)
      return NextResponse.json({ message: "Payment record not found." });

    const payment = payResult.rows[0];
    if (payment.status === "completed")
      return NextResponse.json({ message: "Already processed." });

    // ── Exact amount verification ─────────────────────────────────────────────
    const expectedAmount = parseFloat(payment.amount);
    const actualAmount   = parseFloat(verifyData.data.amount);

    if (actualAmount < expectedAmount) {
      // Underpayment — flag but do not unlock
      await pool.query(
        "UPDATE payments SET status = 'underpaid' WHERE flutterwave_ref = $1",
        [tx_ref]
      );
      console.warn(`[webhook] Underpayment: expected ₦${expectedAmount}, got ₦${actualAmount} — ref: ${tx_ref}`);
      return NextResponse.json({ message: "Underpayment detected. Access not granted." });
    }

    // Calculate expiry
    const durationDays = PLAN_DURATIONS[payment.plan_type];
    const expiresAt    = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    await pool.query("UPDATE payments SET status = 'completed' WHERE flutterwave_ref = $1", [tx_ref]);
    await pool.query(
      "UPDATE users SET is_paid = TRUE, plan_type = $1, plan_expires_at = $2 WHERE id = $3",
      [payment.plan_type, expiresAt, payment.user_id]
    );

    const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [payment.user_id]);
    if (userResult.rows[0])
      sendPaymentConfirmation(userResult.rows[0].email, payment.plan_type).catch(console.error);

    return NextResponse.json({ message: "Payment processed successfully." });
  } catch (err) {
    console.error("[payment/webhook]", err);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
