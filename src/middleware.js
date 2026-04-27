// TODO: replace in-memory store with Redis for production (shared across instances)
import { NextResponse } from "next/server";

const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    request.method === "POST" &&
    (pathname === "/api/auth/login" || pathname === "/api/auth/verify")
  ) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const key = `${ip}:${pathname}`;
    const now = Date.now();
    const entry = attempts.get(key);

    if (entry && now - entry.windowStart < WINDOW_MS) {
      if (entry.count >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many attempts. Try again in 15 minutes." },
          { status: 429 }
        );
      }
      entry.count++;
    } else {
      attempts.set(key, { count: 1, windowStart: now });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/login", "/api/auth/verify"],
};
