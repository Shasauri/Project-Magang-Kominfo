import { NextRequest, NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  if (!apiUrl) {
    return NextResponse.json(
      { message: "API backend belum dikonfigurasi." },
      { status: 500 }
    );
  }

  const { path } = await context.params;
  const backendUrl = apiUrl.replace(/\/api\/?$/, "");
  const target = new URL(`${backendUrl}/storage/${path.join("/")}`);
  target.search = new URL(request.url).search;

  let upstream: Response;
  try {
    upstream = await fetch(target, { redirect: "manual" });
  } catch (error) {
    console.error("Storage proxy request failed:", error);
    return NextResponse.json(
      { message: "Tidak dapat terhubung ke server backend." },
      { status: 502 }
    );
  }

  const headers = new Headers();
  for (const name of ["content-type", "content-length", "cache-control", "etag"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
