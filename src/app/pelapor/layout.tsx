"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

const getStoredToken = () => {
  if (typeof window === "undefined") return null;

  const cookieToken = getCookie("token");
  if (cookieToken) return cookieToken;

  const localToken = localStorage.getItem("token");
  if (localToken) {
    const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `token=${localToken}; expires=${expires}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax${secureFlag}`;
  }

  return localToken;
};

export default function PelaporLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [userName, setUserName] = useState("Pelapor");
  
  // STATE BARU: Untuk mengontrol buka/tutup sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = getStoredToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          localStorage.removeItem("token");
          document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setUserName(data.name || "Ahmad");
      } catch (error) {
        console.error("Gagal mengambil data user:", error);
      }
    };

    const handlePageShow = () => {
      if (!getStoredToken()) router.replace("/login");
    };

    fetchUser();
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [router]);

  const handleLogout = async () => {
    const token = getStoredToken();
    if (token) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
        });
      } catch (error) {
        console.error("Gagal mengakhiri sesi di server:", error);
      }
    }
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("token");
    router.replace("/login");
  };

  const getPageTitle = () => {
    if (pathname === "/pelapor") return "Dashboard";
    if (pathname.includes("/pelapor/profil")) return "Profil Akun";
    if (pathname.includes("/pelapor/tambah-laporan")) return "Tambah Proposal";
    return "Sistem SIFOKAM";
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden relative">
      {/* SIDEBAR KIRI (Dibuat dinamis lebarnya berdasarkan state isSidebarOpen) */}
      <aside className={`bg-white border-r border-slate-100 flex flex-col shrink-0 h-full transition-all duration-300 ${isSidebarOpen ? "w-[260px]" : "w-0 overflow-hidden"}`}>
        <div className="h-24 flex items-center px-8 border-b border-transparent shrink-0 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image src="/images/Logo.png" alt="Logo SIFOKAM" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight tracking-wide">SIFOKAM</h1>
              <p className="text-[8px] text-slate-500 uppercase font-semibold leading-tight mt-0.5">
                Sistem Form<br/>Kategori Media<br/>KOMDIGI
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 whitespace-nowrap">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Menu Utama</p>
            <div className="flex flex-col gap-1">
              <Link 
                href="/pelapor" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  pathname === "/pelapor" || pathname.includes("/pelapor/reports") || pathname.includes("/pelapor/tambah-laporan")
                    ? "bg-blue-600 text-white shadow-md" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
                Dashboard
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Akun</p>
            <div className="flex flex-col gap-1">
              <Link 
                href="/pelapor/profil" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  pathname.includes("/pelapor/profil") 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                Profil
              </Link>

              <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-[#D65F64] hover:bg-red-600 shadow-sm transition-all text-left w-full mt-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
                Keluar Akun
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-24 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            {/* TOMBOL TOGGLE DIHUBUNGKAN KE STATE */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              title="Tampilkan/Sembunyikan Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
            </button>
            <h1 className="text-2xl font-bold text-blue-600">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-100/80 px-4 py-2 rounded-full border border-slate-200">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-blue-600">{userName}</span>
              <span className="text-[10px] text-slate-500 font-medium">Pelapor</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              {userName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      {/* MODAL KELUAR */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl overflow-hidden p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center text-slate-700 mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Konfirmasi Keluar</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-8">
              Apakah Anda yakin ingin keluar dari akun ini?<br />
              <strong className="text-slate-800 text-sm block my-1">{userName}</strong>
              anda akan keluar dari akun ini<br />
              anda dapat login kembali nanti
            </p>
            <div className="flex items-center gap-3 w-full">
              <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={handleLogout} className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors">
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}