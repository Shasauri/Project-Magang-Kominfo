"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Helper untuk membaca token
const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

// Helper inisial nama
const getInitials = (name: string) => {
  if (!name) return "NA";
  const words = name.trim().split(" ");
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function ProfilPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // State Form Informasi Pribadi
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // State Form Kata Sandi
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // State Toggle Mata Password
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Ambil Data Profil
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getCookie("token");
      if (!token) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setName(data.name || "");
          setEmail(data.email || "");
        }
      } catch (error) {
        console.error("Gagal memuat profil:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handler Simpan Profil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setSuccessMessage("");
    setErrorMessage("");
    const token = getCookie("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.message || "Gagal memperbarui profil.");
        return;
      }

      if (data.user) setUser(data.user);
      setSuccessMessage("Profil Berhasil Diperbarui");
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler Update Kata Sandi
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    
    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi baru tidak cocok!");
      return;
    }

    setIsSavingPassword(true);
    const token = getCookie("token");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword
        })
      });

      if (res.ok) {
        setSuccessMessage("Password Berhasil Diperbarui");
        setTimeout(() => setSuccessMessage(""), 2000);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setErrorMessage(data.message || "Gagal memperbarui kata sandi.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Memuat profil...</div>;
  }

  return (
    <div className="p-8 lg:p-10 w-full flex flex-col lg:flex-row gap-8 items-start">
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
      
      {/* ---------------- BAGIAN KIRI: KARTU IDENTITAS ---------------- */}
      <div className="w-full lg:w-[320px] bg-[#f0f7ff] rounded-3xl p-8 flex flex-col items-center text-center shadow-sm border border-blue-50 shrink-0">
        <div className="relative mb-6">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-[6px] border-white bg-white shadow-sm">
            <Image
              src="/images/Zani.jpeg"
              alt="Foto profil admin"
              fill
              className="object-cover"
              sizes="112px"
            />
          </div>
          <div className="absolute bottom-1 right-1 w-8 h-8 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm cursor-pointer hover:bg-blue-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 mb-1">{user?.name || "Admin Name"}</h2>
        <p className="text-sm text-slate-500 capitalize mb-6">Admin {user?.role === 'admin' ? 'Sistem' : user?.role}</p>
        
        <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
          <div className={`w-2 h-2 rounded-full ${user?.status === 'aktif' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-xs font-bold ${user?.status === 'aktif' ? 'text-green-600' : 'text-red-600'}`}>
            {user?.status === 'aktif' ? 'Aktif' : 'Non Aktif'}
          </span>
        </div>
      </div>

      {/* ---------------- BAGIAN KANAN: FORM PENGATURAN ---------------- */}
      <div className="flex-1 flex flex-col gap-8 w-full">
        
        {/* Form Informasi Pribadi */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Informasi Pribadi</h3>
            <p className="text-xs text-slate-500 mt-1">Kelola data diri dasar untuk akun SIFOKAM Anda.</p>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Username</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Hak Akses Sistem</label>
                <div className="relative">
                  <input 
                    type="text" 
                    disabled 
                    value="Admin" 
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-2">Alamat Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={isSavingProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {isSavingProfile ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>

        {/* Form Ubah Kata Sandi */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Ubah Kata Sandi Akun</h3>
            <p className="text-xs text-slate-500 mt-1">Perbarui kata sandi Anda untuk menjaga keamanan.</p>
          </div>

          <form onSubmit={handleUpdatePassword}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              
              {/* Kata Sandi Saat Ini */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Kata Sandi Saat Ini</label>
                <div className="relative">
                  <input 
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi saat ini..."
                    required
                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-400"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600">
                    {showCurrent ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Kata Sandi Baru */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Kata Sandi Baru</label>
                <div className="relative">
                  <input 
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru..."
                    required
                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-400"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600">
                    {showNew ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Kata Sandi Baru */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Konfirmasi Kata Sandi Baru</label>
                <div className="relative">
                  <input 
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru..."
                    required
                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-400"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600">
                    {showConfirm ? (
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
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold py-2.5 px-6 rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {isSavingPassword ? "Memproses..." : "Perbarui Password"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}