export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set("projekkt_token", "", { maxAge: 0, path: "/" });
  return response;
}
