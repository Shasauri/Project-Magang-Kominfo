import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Read actual Host header sent by browser (e.g. localhost:3000) to prevent redirecting to 0.0.0.0 inside Docker
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const target = new URL("/auth/google/callback", `${protocol}://${host}`);

  if (code) {
    target.searchParams.set("code", code);
  }

  if (state) {
    target.searchParams.set("state", state);
  }

  return NextResponse.redirect(target);
}
