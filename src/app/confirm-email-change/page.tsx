"use client";

import { useEffect, useState } from "react";

export default function ConfirmEmailChangePage() {
  const [message, setMessage] = useState("Memproses konfirmasi alamat email...");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      queueMicrotask(() => setMessage("Token konfirmasi tidak ditemukan."));
      return;
    }

    const confirmEmailChange = async () => {
      try {
        const response = await fetch("/api/backend/auth/confirm-email-change", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setMessage(data.message || "Token konfirmasi tidak valid atau sudah kedaluwarsa.");
          return;
        }

        setIsSuccess(true);
        setMessage(data.message || "Alamat email berhasil dikonfirmasi.");
        setTimeout(() => window.location.replace("/login"), 3000);
      } catch (error) {
        console.error("Gagal mengonfirmasi perubahan email:", error);
        setMessage("Terjadi kesalahan jaringan. Silakan coba lagi.");
      }
    };

    confirmEmailChange();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isSuccess ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}>
          {isSuccess ? "✓" : "..."}
        </div>
        <h1 className="text-lg font-bold text-slate-900">Konfirmasi Email</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        {isSuccess && <p className="mt-4 text-xs text-slate-500">Anda akan diarahkan ke halaman login.</p>}
      </div>
    </main>
  );
}
