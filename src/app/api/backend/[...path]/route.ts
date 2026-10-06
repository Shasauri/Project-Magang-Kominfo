import { NextRequest, NextResponse } from "next/server";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const jsonResponse = (body: unknown, status: number, headers?: HeadersInit) =>
  NextResponse.json(body, { status, headers });

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  if (!apiUrl) {
    return jsonResponse({ message: "API backend belum dikonfigurasi." }, 500);
  }

  const { path } = await context.params;
  const target = new URL(`${apiUrl.replace(/\/$/, "")}/${path.join("/")}`);
  target.search = new URL(request.url).search;

  const headers = new Headers(request.headers);
  const token = request.cookies.get("token")?.value;
  headers.delete("host");
  headers.delete("cookie");
  headers.delete("content-length");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    headers.delete("Authorization");
  }

  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });
  } catch (error) {
    console.error("Backend proxy request failed:", error);
    return jsonResponse({ message: "Tidak dapat terhubung ke server backend." }, 502);
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  const contentDisposition = upstream.headers.get("content-disposition");
  if (contentDisposition) responseHeaders.set("content-disposition", contentDisposition);

  const isAuthEndpoint =
    path[0] === "auth" &&
    ["login", "register", "refresh"].includes(path[1] || "");
  const isGoogleCallback = path.join("/") === "auth/google/callback";
  let authData: Record<string, unknown> | null = null;
  if ((isAuthEndpoint || isGoogleCallback) && upstream.ok) {
    const responseClone = upstream.clone();
    authData = await responseClone.json().catch(() => null);
    if (authData?.access_token) {
      const accessToken = String(authData.access_token);
      delete authData.access_token;
      const response = NextResponse.json(authData, {
        status: upstream.status,
        headers: responseHeaders,
      });
      response.cookies.set("token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: Math.max(60, Number(authData.expires_in) || 3600),
      });
      return response;
    }
  }

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });

  if (path.join("/") === "auth/logout") {
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}
