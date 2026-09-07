"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const setAuthCookie = (token: string, shouldRemember: boolean) => {
  const maxAge = shouldRemember ? 30 * 24 * 60 * 60 : 60 * 60;
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  const expires = new Date(Date.now() + maxAge * 1000).toUTCString();

  document.cookie = `token=${token}; expires=${expires}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
  localStorage.setItem("token", token);
};

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Memproses login Google...");
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const processGoogleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code) {
        setMessage("Login Google dibatalkan atau parameter tidak valid.");
        setTimeout(() => router.replace("/login"), 1500);
        return;
      }

      try {
        const query = new URLSearchParams({ code, ...(state ? { state } : {}) }).toString();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback?${query}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.access_token) {
          throw new Error(data.message || "Gagal menyelesaikan login Google.");
        }

        setAuthCookie(data.access_token, true);

        if (data.user && data.user.role) {
          router.replace(data.user.role === "admin" ? "/admin" : "/pelapor");
          return;
        }

        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (!meRes.ok) {
          throw new Error("Gagal memeriksa profil pengguna.");
        }

        const meData = await meRes.json();
        router.replace(meData.role === "admin" ? "/admin" : "/pelapor");
      } catch (error) {
        console.error("Google callback error:", error);
        setMessage(error instanceof Error ? error.message : "Terjadi kesalahan saat login Google.");
        setTimeout(() => router.replace("/login"), 2000);
      }
    };

    processGoogleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <h1 className="text-xl font-bold text-slate-900">Login Google</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 px-6"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><p className="text-sm text-slate-600">Memuat callback Google...</p></div></div>}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
