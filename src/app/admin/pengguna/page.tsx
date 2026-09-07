"use client";

import { useEffect, useState } from "react";

// Helper untuk mengambil token dari cookies
const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

// Helper inisial nama & warna avatar
const getInitials = (name: string) => {
  if (!name) return "U";
  const words = name.trim().split(" ");
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (initials: string) => {
  const colors = [
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-pink-100 text-pink-600",
    "bg-indigo-100 text-indigo-600",
    "bg-teal-100 text-teal-600",
  ];
  return colors[(initials.charCodeAt(0) || 0) % colors.length];
};

export default function DaftarPenggunaPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Filter & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [perPage, setPerPage] = useState(10);
  
  // Trigger untuk memuat ulang tabel setelah edit/hapus
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // State Modals & Edit Form
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editStatus, setEditStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Detail Statistik Laporan
  const [userSummary, setUserSummary] = useState({ verified: 0, unverified: 0 });
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Efek Debounce Pencarian
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memanggil API Data Tabel
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      const token = getCookie("token");
      if (!token) return;

      try {
        let url = `${process.env.NEXT_PUBLIC_API_URL}/admin/users?page=${currentPage}`;
        if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
        if (statusFilter) url += `&status=${statusFilter}`;

        const res = await fetch(url, {
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUsers(data.data || []);
          setCurrentPage(data.current_page || 1);
          setTotalPages(data.last_page || 1);
          setTotalUsers(data.total || 0);
          setPerPage(data.per_page || 10);
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [currentPage, debouncedSearch, statusFilter, refreshTrigger]);

  // Memanggil API Detail User Saat Modal Terbuka
  useEffect(() => {
    if (isEditModalOpen && selectedUser) {
      const fetchUserSummary = async () => {
        setIsLoadingSummary(true);
        try {
          const token = getCookie("token");
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.reports_summary) {
              setUserSummary({
                verified: data.reports_summary.verified || 0,
                unverified: data.reports_summary.unverified || 0,
              });
            }
          }
        } catch (error) {
          console.error("Gagal mengambil detail statistik pengguna:", error);
        } finally {
          setIsLoadingSummary(false);
        }
      };
      
      fetchUserSummary();
    } else {
      // Reset state ketika modal ditutup
      setUserSummary({ verified: 0, unverified: 0 });
    }
  }, [isEditModalOpen, selectedUser]);

  // HANDLER MODALS
  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setEditStatus(user.status?.toLowerCase() === "aktif" ? "aktif" : "non-aktif");
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user: any) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const closeModal = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  // API CAll: Update Status
  const handleUpdateStatus = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    const token = getCookie("token");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: editStatus }),
      });

      if (res.ok) {
        closeModal();
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert("Gagal memperbarui status pengguna.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // API CAll: Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    const token = getCookie("token");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      });

      if (res.ok) {
        closeModal();
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert("Gagal menghapus pengguna.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 lg:p-10 w-full relative">
      {/* ---------------- BAGIAN UTAMA (TABEL) ---------------- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 min-h-[500px] flex flex-col">
        {/* Baris Pencarian & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama pengguna, id, status..."
              className="block w-full rounded-xl border border-slate-200 pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-slate-50/50"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="block w-full appearance-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="non-aktif">Non Aktif</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            </div>
          </div>
        </div>

        {/* Tabel Pengguna */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold text-xs border-y border-slate-100">
                <th className="px-6 py-4 rounded-tl-lg">Nama Pengguna</th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center rounded-tr-lg">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">Memuat data...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">Tidak ada pengguna.</td></tr>
              ) : (
                users.map((user, idx) => {
                  const initials = getInitials(user.name);
                  const avatarColor = getAvatarColor(initials);
                  const isAktif = user.status?.toLowerCase() === "aktif";
                  const userId = user.employee_id || user.id_number || user.id;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor}`}>
                            {initials}
                          </div>
                          <span className="font-semibold text-slate-800">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{userId}</td>
                      <td className="px-6 py-4 text-slate-800 font-medium">{user.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-md text-[11px] font-bold ${isAktif ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                          {isAktif ? "Aktif" : "Non Aktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Tombol Edit memanggil openEditModal */}
                          <button onClick={() => openEditModal(user)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                          </button>
                          {/* Tombol Hapus memanggil openDeleteModal */}
                          <button onClick={() => openDeleteModal(user)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Hapus">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium">
            Menampilkan {users.length > 0 ? (currentPage - 1) * perPage + 1 : 0} sampai {Math.min(currentPage * perPage, totalUsers)} dari total {totalUsers} pengguna
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg></button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) { pageNum = currentPage - 2 + i; if (pageNum > totalPages) return null; }
              return (
                <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${currentPage === pageNum ? "bg-blue-600 text-white border border-blue-600 shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{pageNum}</button>
              );
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg></button>
          </div>
        </div>
      </div>

      {/* ---------------- MODAL EDIT USER ---------------- */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="p-8 pb-6 relative flex items-center gap-6 border-b border-slate-100">
              <button onClick={closeModal} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h2>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm font-medium text-slate-500">ID : {selectedUser.employee_id || selectedUser.id_number || selectedUser.id}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${editStatus === "aktif" ? "text-green-600" : "text-red-600"}`}>
                    <span className={`w-2 h-2 rounded-full ${editStatus === "aktif" ? "bg-green-500" : "bg-red-500"}`}></span>
                    {editStatus === "aktif" ? "Aktif" : "Non Aktif"}
                  </span>
                </div>
              </div>
            </div>

            {/* Body Form Modal */}
            <div className="p-8 overflow-y-auto space-y-6">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Email</label>
                <input type="text" disabled value={selectedUser.email} className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-medium text-sm outline-none cursor-not-allowed" />
              </div>

              {/* Nama Pengguna & ID Combined */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">NAMA PENGGUNA</label>
                <div className="flex items-center gap-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-not-allowed">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                    {getInitials(selectedUser.name)}
                  </div>
                  <span className="font-bold text-slate-800 text-sm w-1/3 truncate">{selectedUser.name}</span>
                  <span className="text-slate-500 text-sm font-medium border-l border-slate-200 pl-4">ID : {selectedUser.employee_id || selectedUser.id_number || selectedUser.id}</span>
                </div>
              </div>

              {/* Role & Status (Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Role</label>
                  <input type="text" disabled value="Pelapor" className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-medium text-sm outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">STATUS PENGGUNA</label>
                  <div className="relative">
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="block w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 font-medium text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="non-aktif">Non Aktif</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Laporan Statistics API Terintegrasi */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Jumlah Yang Telah Di Laporkan</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-2">
                    {isLoadingSummary ? (
                      <span className="text-xs text-slate-400 px-3 py-1.5 font-medium italic">Memuat...</span>
                    ) : (
                      <span className="bg-green-100 text-green-700 font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
                        {userSummary.verified} LAPORAN
                      </span>
                    )}
                    <span className="text-slate-600 text-xs font-medium">Telah Di Verifikasi</span>
                  </div>
                  <div className="flex items-center gap-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-2">
                    {isLoadingSummary ? (
                      <span className="text-xs text-slate-400 px-3 py-1.5 font-medium italic">Memuat...</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
                        {userSummary.unverified} LAPORAN
                      </span>
                    )}
                    <span className="text-slate-600 text-xs font-medium">Belum Di Verifikasi</span>
                  </div>
                </div>
              </div>
              
              {/* Tombol Simpan */}
              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleUpdateStatus}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL HAPUS USER ---------------- */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl overflow-hidden p-8 text-center">
            
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-3">Hapus Akun Pengguna?</h3>
            
            <p className="text-sm text-slate-500 leading-relaxed mb-8">
              Apakah Anda yakin ingin menghapus <br />
              <span className="font-bold text-slate-800">{selectedUser.name}</span> <br />
              dari Sistem? <br /><br />
              Data laporan pengguna ini di <br />
              aplikasi terkait akan terhapus secara permanen.
            </p>
            
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={closeModal} 
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteUser} 
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Proses..." : "Ya, Hapus Data"}
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}