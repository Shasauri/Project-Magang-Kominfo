"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  
  // State untuk form login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // State untuk CAPTCHA
  const [captcha, setCaptcha] = useState("");
  const [captchaImg, setCaptchaImg] = useState("");
  const [captchaKey, setCaptchaKey] = useState("");
  
  // State untuk loading & error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const setAuthCookie = (token: string, shouldRemember: boolean) => {
    const maxAge = shouldRemember ? 30 * 24 * 60 * 60 : 60 * 60;
    const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
    const expires = new Date(Date.now() + maxAge * 1000).toUTCString();

    document.cookie = `token=${token}; expires=${expires}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
    localStorage.setItem("token", token);
  };

  // Fungsi untuk memuat CAPTCHA dari backend
  const loadCaptcha = async (isReload = false) => {
    try {
      const endpoint = isReload ? "/captcha/reload" : "/captcha";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`);
      
      if (res.ok) {
        const data = await res.json();
        setCaptchaImg(data.captcha_img);
        setCaptchaKey(data.captcha_key);
        setCaptcha(""); 
      }
    } catch (error) {
      console.error("Gagal memuat CAPTCHA:", error);
      setErrorMsg("Gagal memuat CAPTCHA. Pastikan server backend menyala.");
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMsg("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`);
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.message || "Gagal membuat tautan login Google.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Google login error:", error);
      setErrorMsg(error instanceof Error ? error.message : "Gagal masuk dengan Google.");
      setIsLoading(false);
    }
  };

  // Fungsi handle submit form login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          captcha,
          captcha_key: captchaKey,
          remember_me: rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Terjadi kesalahan saat login.");
        loadCaptcha(true);
        setIsLoading(false);
        return;
      }

      // 1. Simpan Token
      setAuthCookie(data.access_token, rememberMe);

      // 2. Cek Role User untuk Redirect
      // Opsi A: Jika respons API login SUDAH menyertakan data user (misal: data.user.role)
      if (data.user && data.user.role) {
        if (data.user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/pelapor");
        }
      } 
      // Opsi B: Jika API login hanya mengembalikan token, kita hit API /auth/me
      else {
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            "Authorization": `Bearer ${data.access_token}`,
            "Content-Type": "application/json"
          }
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/pelapor");
          }
        } else {
          // Fallback jika gagal ambil profil
          setErrorMsg("Gagal memverifikasi tipe akun Anda.");
          loadCaptcha(true);
        }
      }
      
    } catch (error) {
      setErrorMsg("Terjadi kesalahan jaringan.");
      loadCaptcha(true);
    } finally {
      // Note: Sengaja tidak set isLoading(false) jika sukses agar tombol tetap "Memproses..." 
      // saat Next.js sedang memuat halaman baru
      if (errorMsg) {
         setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
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
              <div className="relative w-16 h-12 flex-shrink-0">
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
            <div className="rounded-2xl bg-slate-900/60 p-8 text-white backdrop-blur-md border border-white/20 shadow-xl max-w-lg">
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

      {/* BAGIAN KANAN - Form Login */}
      <div className="flex w-full flex-col justify-center px-6 py-4 lg:w-1/2 lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-5 shadow-sm sm:p-6 border border-slate-100">
          
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 md:text-2xl">Selamat Datang</h2>
            <p className="mt-1 text-xs text-slate-500">
              Silakan masuk untuk mengakses sistem pengelolaan kategori media.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            
            {/* Input Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700">Email</label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  required
                  className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Input Kata Sandi */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700">Kata Sandi</label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  required
                  className="block w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Custom CAPTCHA Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <label htmlFor="captcha" className="block text-xs font-semibold text-slate-700 mb-2">
                Masukkan Kode Keamanan
              </label>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-[54px] w-full max-w-[345px] bg-white border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center">
                    {captchaImg ? (
                      <img src={captchaImg} alt="CAPTCHA" className="h-full w-full object-fill" />
                    ) : (
                      <span className="text-[10px] text-slate-400">Memuat...</span>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => loadCaptcha(true)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                </div>
                
                <input
                  id="captcha"
                  type="text"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  placeholder="Ketik 6 karakter"
                  maxLength={6}
                  required
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-center tracking-[0.4em] font-mono uppercase font-bold shadow-sm"
                />
              </div>
            </div>

            {/* Checkbox & Lupa Sandi */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600">
                  Tetap Masuk
                </label>
              </div>
              <div className="text-xs">
                <Link href="/lupa-sandi" className="font-semibold text-blue-600 hover:text-blue-500">
                  Lupa Sandi?
                </Link>
              </div>
            </div>

            {/* Tombol Masuk */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isLoading ? "Memproses..." : "Masuk"}
              </button>
            </div>
            
            {/* Tombol Google */}
            <div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                  <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                </svg>
                {isLoading ? "Memproses..." : "Sign in with Google"}
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold leading-6 text-blue-600 hover:text-blue-500">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}