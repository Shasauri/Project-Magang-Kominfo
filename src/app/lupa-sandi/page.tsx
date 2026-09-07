"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaImg, setCaptchaImg] = useState("");
  const [captchaKey, setCaptchaKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadCaptcha = async (reload = false) => {
    try {
      const endpoint = reload ? "/captcha/reload" : "/captcha";
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`);
      if (!response.ok) throw new Error("Captcha request failed");
      const data = await response.json();
      setCaptchaImg(data.captcha_img);
      setCaptchaKey(data.captcha_key);
      setCaptcha("");
    } catch {
      setErrorMsg("Gagal memuat CAPTCHA. Pastikan server backend menyala.");
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setMessage("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captcha, captcha_key: captchaKey }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || "Gagal mengirim tautan reset password.");
        await loadCaptcha(true);
        return;
      }

      setMessage(data.message || "Jika email terdaftar, tautan reset password akan dikirim.");
      setCaptcha("");
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan.");
      await loadCaptcha(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="relative hidden w-1/2 lg:block">
        <Image src="/images/BG-image.png" alt="Background Dinas Kominfo" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative flex h-full flex-col p-12">
          <div className="w-fit rounded-xl bg-white p-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-16 shrink-0"><Image src="/images/Logo.png" alt="Logo Komdigi" fill className="object-contain object-left" /></div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="flex flex-col text-slate-800"><span className="text-sm font-bold tracking-wide">SIFOKAM</span><span className="text-[10px] leading-tight text-slate-500">SISTEM FORM <br /> KATEGORI MEDIA</span></div>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center pb-45">
            <div className="max-w-lg rounded-2xl border border-white/20 bg-slate-900/60 p-8 text-white shadow-xl backdrop-blur-md">
              <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl">Sistem Informasi Form Kategori Media</h1>
              <p className="text-lg text-slate-200">Portal akses resmi untuk pengelolaan data dan pengajuan kategori media digital institusi.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-8 lg:w-1/2 lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Lupa Kata Sandi</h2>
            <p className="mt-2 text-sm text-slate-500">Masukkan email Anda untuk mereset kata sandi.</p>
          </div>

          {errorMsg && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{errorMsg}</div>}
          {message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-700">{message}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700">Email</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Masukkan email" required className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <label htmlFor="captcha" className="mb-2 block text-xs font-semibold text-slate-700">Masukkan Kode Keamanan</label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-[54px] w-full items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-white">
                    {captchaImg ? <img src={captchaImg} alt="CAPTCHA" className="h-full w-full object-fill" /> : <span className="text-[10px] text-slate-400">Memuat...</span>}
                  </div>
                  <button type="button" onClick={() => loadCaptcha(true)} aria-label="Muat ulang CAPTCHA" className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-100 hover:text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                  </button>
                </div>
                <input id="captcha" type="text" value={captcha} onChange={(event) => setCaptcha(event.target.value)} placeholder="Ketik 6 karakter" maxLength={6} required className="block w-full rounded-lg border border-slate-300 px-3 py-3 text-center font-mono text-sm font-bold uppercase tracking-[0.4em] text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="flex w-full justify-center rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400">{isLoading ? "Memproses..." : "Kirim Tautan Reset"}</button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-500">Kembali ke halaman <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">Masuk</Link></p>
        </div>
      </div>
    </div>
  );
}
