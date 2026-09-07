import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const target = new URL("/auth/google/callback", request.url);

  if (code) {
    target.searchParams.set("code", code);
  }

  if (state) {
    target.searchParams.set("state", state);
  }

  return NextResponse.redirect(target);
}
