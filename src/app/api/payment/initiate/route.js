// ── DEPRECATED — DO NOT USE ───────────────────────────────────────────────────
// This route (subscription-based weekly/monthly plans) was removed.
// All payments now go through /api/credits/topup (credit bundles).
// This file returns 410 Gone so any stale calls fail loudly in logs.
// ─────────────────────────────────────────────────────────────────────────────
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is no longer active. Use /api/credits/topup instead." },
    { status: 410 }
  );
}
