"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Helper Token
const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

export default function ProfilPelaporPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  // State untuk form Informasi Pribadi
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // State untuk form Kata Sandi
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Toggle visibilitas kata sandi
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Ambil Data User Saat Load
  useEffect(() => {
    const fetchUser = async () => {
      const token = getCookie("token");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
          setName(data.name || "");
          setEmail(data.email || "");
        }
      } catch (error) {
        console.error("Gagal mengambil data user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Handler Simpan Profil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setSuccessMessage("");
    setErrorMessage("");
    const token = getCookie("token");

    try {
      // Menggunakan PUT /api/auth/me sesuai dokumentasi API terbaru
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email })
      });

      if (res.ok) {
        setSuccessMessage("Profil Berhasil Diperbarui");
        setTimeout(() => setSuccessMessage(""), 2000);
        const updatedData = await res.json();
        if (updatedData.user) setUserData(updatedData.user);
      } else {
        const err = await res.json();
        setErrorMessage(err.message || "Gagal memperbarui profil.");
      }
    } catch (error) {
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler Ganti Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok!");
      return;
    }

    setIsSavingPassword(true);
    const token = getCookie("token");

    try {
      // Menggunakan endpoint spesifik untuk Change Password sesuai dokumen terbaru
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me/password`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          current_password: currentPassword, // Sandi saat ini
          password: newPassword,             // Sandi baru (menggunakan key 'password' sesuai API)
          password_confirmation: confirmPassword
        })
      });

      if (res.ok) {
        setSuccessMessage("Password Berhasil Diperbarui");
        setTimeout(() => setSuccessMessage(""), 2000);
        // Kosongkan form setelah berhasil
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const err = await res.json();
        // Tangkap pesan error spesifik, misalnya jika password saat ini salah (422)
        setErrorMessage(err.message || "Gagal memperbarui kata sandi.");
      }
    } catch (error) {
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  // Generate Inisial untuk Avatar
  const getInitials = (fullName: string) => {
    if (!fullName) return "NA";
    return fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-8 h-full bg-slate-50 overflow-y-auto">
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4">
          <div className="flex min-h-[120px] w-full max-w-sm flex-col items-center justify-center rounded-xl bg-white px-6 py-5 text-center shadow-xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-900">{successMessage}</p>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="fixed left-1/2 top-6 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs text-red-600 shadow-sm">
          {errorMessage}
        </div>
      )}
      
      {/* ================= BAGIAN KIRI: KARTU PROFIL ================= */}
      <div className="w-full lg:w-[320px] bg-[#EEF5FF] rounded-3xl p-10 flex flex-col items-center justify-center h-fit shadow-sm shrink-0">
        <div className="relative mb-6">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-slate-100 bg-white shadow-sm">
            <Image
              src="/images/Remielle.jpeg"
              alt="Foto profil"
              fill
              className="object-cover"
              sizes="112px"
              onError={(event) => {
                event.currentTarget.style.display = "none";
                event.currentTarget.parentElement?.classList.add("items-center", "justify-center", "text-3xl", "font-bold", "text-blue-600");
                if (event.currentTarget.parentElement) {
                  event.currentTarget.parentElement.textContent = getInitials(userData?.name || name);
                }
              }}
            />
          </div>
          {/* Ikon Edit Avatar */}
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-blue-700 transition-colors shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" /></svg>
          </button>
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 mb-1 text-center">{userData?.name || name || "Pelapor"}</h2>
        <p className="text-xs text-slate-500 mb-6 font-medium capitalize text-center">{userData?.role || "Pelapor"}</p>
        
        <div className="px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold flex items-center gap-2 border border-green-200">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          Aktif
        </div>
      </div>

      {/* ================= BAGIAN KANAN: FORM ================= */}
      <div className="flex-1 flex flex-col gap-6 max-w-4xl">
        
        {/* Form Informasi Pribadi */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Informasi Pribadi</h3>
            <p className="text-xs text-slate-500 mt-1">Kelola data diri dasar untuk akun SIFOKAM Anda.</p>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Username</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              {/* Hak Akses (Readonly) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Hak Akses Sistem</label>
                <div className="relative">
                  <input 
                    type="text"
                    value="Pelapor"
                    disabled
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                  </div>
                </div>
              </div>

              {/* Alamat Email */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">Alamat Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                  </div>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm text-slate-700 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={isSavingProfile}
                className="py-2.5 px-6 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingProfile && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                )}
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>

        {/* Form Ubah Kata Sandi */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Ubah Kata Sandi Akun</h3>
            <p className="text-xs text-slate-500 mt-1">Perbarui kata sandi Anda untuk menjaga keamanan.</p>
          </div>

          <form onSubmit={handleUpdatePassword}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* Sandi Saat Ini */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-2">Kata Sandi Saat Ini</label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi saat ini..."
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-700 focus:border-blue-500 outline-none placeholder-slate-400"
                    required
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600">
                    {showCurrentPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Sandi Baru */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-2">Kata Sandi Baru</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru..."
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-700 focus:border-blue-500 outline-none placeholder-slate-400"
                    required
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600">
                    {showNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Sandi Baru */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-2">Konfirmasi Kata Sandi Baru</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru..."
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-700 focus:border-blue-500 outline-none placeholder-slate-400"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={isSavingPassword}
                className="py-2.5 px-6 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingPassword && (
                  <svg className="animate-spin h-4 w-4 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                )}
                {isSavingPassword ? "Memproses..." : "Perbarui Password"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}