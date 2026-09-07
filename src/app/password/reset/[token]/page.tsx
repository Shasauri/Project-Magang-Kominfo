"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";

type ResetPasswordContentProps = {
  initialToken?: string;
  initialEmail?: string | null;
};

export function ResetPasswordContent({ initialToken, initialEmail }: ResetPasswordContentProps = {}) {
  const router = useRouter();
  const params = useParams<{ token?: string }>();
  const searchParams = useSearchParams();
  const token = initialToken ?? params.token ?? "";
  const email = initialEmail ?? searchParams.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setErrorMsg("Token reset tidak valid atau tidak ditemukan.");
      return;
    }
    if (password !== confirmation) {
      setErrorMsg("Kata sandi dan konfirmasi kata sandi tidak cocok.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password, password_confirmation: confirmation }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.message || "Gagal mereset kata sandi.");
        return;
      }
      setMessage(data.message || "Password berhasil direset.");
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Link Reset Tidak Valid</h1>
          <p className="mt-2 text-sm text-slate-500">Link reset password yang Anda buka tidak valid atau sudah kedaluwarsa.</p>
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">Silakan minta link reset password baru dari halaman lupa kata sandi.</div>
          <p className="mt-6 text-center text-xs text-slate-500"><Link href="/lupa-sandi" className="font-semibold text-blue-600 hover:text-blue-500">Kirim ulang link reset</Link></p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Buat Kata Sandi Baru</h1>
        <p className="mt-2 text-sm text-slate-500">Masukkan kata sandi baru untuk akun Anda.</p>
        {errorMsg && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{errorMsg}</div>}
        {message ? <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <PasswordField id="password" label="Kata Sandi Baru" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword(!showPassword)} />
          <PasswordField id="confirmation" label="Konfirmasi Kata Sandi" value={confirmation} onChange={setConfirmation} visible={showConfirmation} onToggle={() => setShowConfirmation(!showConfirmation)} />
          <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400">{isLoading ? "Memproses..." : "Simpan Kata Sandi"}</button>
        </form>}
        <p className="mt-6 text-center text-xs text-slate-500"><Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">Kembali ke halaman Masuk</Link></p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-8"><div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"><p className="text-sm text-slate-600">Memuat form reset password...</p></div></main>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function PasswordField({ id, label, value, onChange, visible, onToggle }: { id: string; label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void }) {
  return <div><label htmlFor={id} className="block text-xs font-semibold text-slate-700">{label}</label><div className="relative mt-2"><input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} required className="block w-full rounded-xl border border-slate-200 px-3 py-3 pr-10 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" /><button type="button" onClick={onToggle} aria-label={visible ? `Sembunyikan ${label}` : `Tampilkan ${label}`} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"><span aria-hidden="true">{visible ? "◉" : "○"}</span></button></div></div>;
}
