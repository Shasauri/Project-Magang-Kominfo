"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { ResetPasswordContent } from "../password/reset/[token]/page";

function ResetPasswordQueryContent() {
  const searchParams = useSearchParams();

  return (
    <ResetPasswordContent
      initialToken={searchParams.get("token") ?? undefined}
      initialEmail={searchParams.get("email")}
    />
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-8">
          <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm text-slate-600">Memuat form reset password...</p>
          </div>
        </main>
      }
    >
      <ResetPasswordQueryContent />
    </Suspense>
  );
}
