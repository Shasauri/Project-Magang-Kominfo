"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  
  // State form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  
  // State Captcha
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaImg, setCaptchaImg] = useState("");
  const [captchaKey, setCaptchaKey] = useState("");
  
  // State UI
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConf, setShowPasswordConf] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Ambil Captcha saat halaman dimuat
  const fetchCaptcha = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/captcha`);
      if (res.ok) {
        const data = await res.json();
        setCaptchaImg(data.captcha_img);
        setCaptchaKey(data.captcha_key);
      }
    } catch (error) {
      console.error("Gagal mengambil captcha:", error);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Set Cookie Helper
  const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setMessage("");

    if (password !== passwordConfirmation) {
      setErrorMsg("Kata sandi dan konfirmasi kata sandi tidak cocok!");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
          password_confirmation: passwordConfirmation,
          captcha: captchaInput,
          captcha_key: captchaKey
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Registrasi berhasil! Anda akan diarahkan ke halaman berikutnya.");
        if (data.access_token) {
          setCookie("token", data.access_token, 1); 
          setTimeout(() => router.push("/pelapor"), 1500);
        } else {
          setMessage("Registrasi berhasil! Silakan masuk dengan akun baru Anda.");
          setTimeout(() => router.push("/login"), 1500);
        }
      } else {
        setErrorMsg(data.message || "Gagal melakukan registrasi.");
        fetchCaptcha(); // Refresh captcha jika gagal
        setCaptchaInput("");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`);
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      setErrorMsg("Gagal menghubungkan ke layanan Google.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      
      {/* BAGIAN KIRI */}
      <div className="relative hidden w-1/2 lg:block">
        <div className="absolute inset-0">
          <Image
            src="/images/BG-image.png"
            alt="Background Dinas Kominfo"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        <div className="relative flex h-full flex-col p-12">
          <div className="w-fit rounded-xl bg-white p-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-16 flex-shrink-0">
                <Image
                  src="/images/Logo.png"
                  alt="Logo Komdigi"
                  fill
                  className="object-contain object-left"
                />
              </div>
              <div className="h-10 w-[1.5px] bg-slate-200"></div>
              <div className="flex flex-col text-slate-800">
                <span className="text-sm font-bold tracking-wide">SIFOKAM</span>
                <span className="text-[10px] leading-tight text-slate-500">
                  SISTEM FORM <br /> KATEGORI MEDIA
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center pb-45">
            <div className="max-w-lg rounded-2xl border border-white/20 bg-slate-900/60 p-8 text-white shadow-xl backdrop-blur-md">
              <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl">
                Sistem Informasi Form Kategori Media
              </h1>
              <p className="text-lg text-slate-200">
                Portal akses resmi untuk pengelolaan data dan pengajuan kategori media digital institusi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BAGIAN KANAN - Form Register */}
      <div className="flex w-full flex-col justify-center px-6 py-4 lg:w-1/2 lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Daftar Akun</h2>
            <p className="mt-1 text-xs text-slate-500">Silakan isi data berikut untuk membuat akun baru.</p>
          </div>

          {errorMsg && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{errorMsg}</div>}
          {message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-700">{message}</div>}

          <form onSubmit={handleRegister} className="space-y-3">
            
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Nama Lengkap</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email"
                className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            {/* Kata Sandi & Konfirmasi */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Kata Sandi</label>
                <div className="relative mt-1">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sandi baru"
                    className="block w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Konfirmasi</label>
                <div className="relative mt-1">
                  <input 
                    type={showPasswordConf ? "text" : "password"}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Ulangi sandi"
                    className="block w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <button type="button" onClick={() => setShowPasswordConf(!showPasswordConf)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Widget Captcha (Sama seperti halaman login) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <label htmlFor="captcha" className="mb-2 block text-xs font-semibold text-slate-700">Masukkan Kode Keamanan</label>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-[54px] w-full max-w-[345px] items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-white">
                    {captchaImg ? (
                      <img src={captchaImg} alt="CAPTCHA" className="h-full w-full object-fill" />
                    ) : (
                      <span className="text-[10px] text-slate-400">Memuat...</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={fetchCaptcha}
                    className="flex-shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-100 hover:text-blue-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                </div>

                <input
                  id="captcha"
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Ketik 6 karakter"
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-sm font-bold uppercase tracking-[0.4em] text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  maxLength={6}
                />
              </div>
            </div>

            {/* Tombol Daftar */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex w-full justify-center rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isLoading && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isLoading ? "Memproses..." : "Daftar"}
            </button>
          </form>

          {/* Tombol Sign Up With Google */}
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign up with Google
          </button>

          {/* Link ke Login */}
          <div className="mt-4 text-center text-xs text-slate-500">
            <p>
              Sudah punya akun?{" "}
              <Link href="/login" className="font-semibold leading-6 text-blue-600 hover:text-blue-500">Masuk</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}