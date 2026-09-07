"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// Helper untuk mengambil token
const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

// Helper format tanggal (DD/MM/YYYY)
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper untuk mencari Nama Media dari array answers
const getMediaName = (answers: any[]) => {
  if (!answers || !Array.isArray(answers)) return "-";
  const mediaAnswer = answers.find(a => 
    a.question?.question_text?.toLowerCase().includes("nama media")
  );
  return mediaAnswer ? mediaAnswer.answer_value : "-";
};

export default function PelaporDashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("Pelapor");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddReportModalOpen, setIsAddReportModalOpen] = useState(false);
  const [mediaTypes, setMediaTypes] = useState<any[]>([]);
  const [selectedMediaType, setSelectedMediaType] = useState("");
  const [mediaName, setMediaName] = useState("");
  
  // State Metrik
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0
  });

  // State Daftar Laporan
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = getCookie("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      try {
        const [userRes, reportsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports`, { headers })
        ]);

        const mediaRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-types`);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUserName(userData.name || "Ahmad");
        }

        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          
          setReports(reportsData);

          // Mengolah data metrik
          const total = reportsData.length;
          const verified = reportsData.filter((r: any) => r.status === 'disetujui').length;
          const unverified = reportsData.filter((r: any) => r.status === 'pending' || r.status === 'proses').length;

          setStats({ total, verified, unverified });
        }

        if (mediaRes.ok) {
          setMediaTypes(await mediaRes.json());
        }
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleOpenAddReportModal = () => {
    setSelectedMediaType("");
    setMediaName("");
    setIsAddReportModalOpen(true);
  };

  const handleContinueAddReport = () => {
    if (!selectedMediaType || !mediaName.trim()) {
      alert("Harap pilih jenis media dan isi nama media.");
      return;
    }

    const params = new URLSearchParams({
      media_type_id: selectedMediaType,
      media_name: mediaName.trim(),
    });
    router.push(`/pelapor/tambah-laporan?${params.toString()}`);
  };

  return (
    <div className="flex w-full h-full relative">
      {isAddReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-base font-bold text-slate-900">Tambah Laporan Media Baru</h2>
              <p className="mt-1 text-[10px] text-slate-500">Pilih jenis dan nama media yang ingin dilaporkan</p>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div>
                <label className="mb-2 block text-[10px] font-bold text-slate-700">Pilih jenis media <span className="text-red-500">*</span></label>
                <select
                  value={selectedMediaType}
                  onChange={(event) => setSelectedMediaType(event.target.value)}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="" disabled>Pilih Jenis Media</option>
                  {mediaTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold text-slate-700">Nama Media <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={mediaName}
                  onChange={(event) => setMediaName(event.target.value)}
                  placeholder="Masukkan nama media"
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsAddReportModalOpen(false)}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleContinueAddReport}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ================= KONTEN UTAMA TENGAH ================= */}
      <main className="flex-1 px-8 lg:px-10 pb-10 pt-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">Selamat Datang, {userName}!</h2>

        {isLoading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-28 bg-slate-200 rounded-3xl w-full"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-28 bg-slate-200 rounded-3xl"></div>
              <div className="h-28 bg-slate-200 rounded-3xl"></div>
            </div>
            <div className="h-64 bg-slate-200 rounded-3xl mt-6"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Kartu 1: Total Laporan */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 w-full">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-400 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M7.5 5.25a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75c-2.73 0-5.36-.442-7.814-1.259-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.5 5.455V5.25Zm7.5 0v.25a49.112 49.112 0 0 0-6 0v-.25a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5Zm-3 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Jumlah Data Laporan</p>
                <h3 className="text-3xl font-bold text-slate-800">{stats.total}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Seluruh Data Laporan Media</p>
              </div>
            </div>

            {/* Grid Kartu 2 & 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Data Laporan Yang Telah Diverifikasi</p>
                  <h3 className="text-3xl font-bold text-slate-800">{stats.verified}</h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-400 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M7.5 5.25a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75c-2.73 0-5.36-.442-7.814-1.259-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.5 5.455V5.25Zm7.5 0v.25a49.112 49.112 0 0 0-6 0v-.25a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5Zm-3 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" /><path d="M3 18.4v-2.796a4.3 4.3 0 0 0 .713.31A26.226 26.226 0 0 0 12 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427-2.195 0-4.356-.145-6.477-.427C4.047 21.128 3 19.852 3 18.4Z" /></svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Data Laporan Yang Belum Di Verifikasi</p>
                  <h3 className="text-3xl font-bold text-slate-800">{stats.unverified}</h3>
                </div>
              </div>
            </div>

            {/* TABEL DAFTAR LAPORAN */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 mt-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Daftar laporan media</h3>
                  <p className="text-xs text-slate-400 mt-1">Memantau list laporan media dari pelapor</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddReportModal}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs py-2 px-4 rounded-full transition-colors"
                >
                  Tambah Laporan
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-xs font-semibold text-slate-400 border-b border-slate-100">
                      <th className="pb-4 font-medium">Kode Media</th>
                      <th className="pb-4 font-medium">Nama Media</th>
                      <th className="pb-4 font-medium">Tanggal Di submit</th>
                      <th className="pb-4 font-medium">Tipe Media</th>
                      <th className="pb-4 font-medium text-center">Kategori</th>
                      <th className="pb-4 font-medium text-center">Penilaian</th>
                      <th className="pb-4 font-medium text-center">STATUS</th>
                      <th className="pb-4 font-medium text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reports.length === 0 ? (
                      <tr><td colSpan={8} className="py-8 text-center text-slate-400">Belum ada data laporan.</td></tr>
                    ) : (
                      reports.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 font-bold text-slate-700 text-xs">{item.report_code}</td>
                          <td className="py-4 font-medium text-slate-600 text-xs">{getMediaName(item.answers)}</td>
                          <td className="py-4 text-slate-500 text-xs">{formatDate(item.submitted_at)}</td>
                          <td className="py-4 text-slate-600 text-xs">{item.media_type?.name || '-'}</td>
                          <td className="py-4 text-center font-bold text-slate-700 text-xs">{item.category}</td>
                          <td className="py-4 text-center font-bold text-slate-800 text-xs">{item.total_score}</td>
                          
                          <td className="py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${
                              item.status === 'disetujui' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-800 text-white' // Style untuk Pending berdasarkan referensi UI
                            }`}>
                              {item.status === 'disetujui' ? 'Terverifikasi' : 'Pending'}
                            </span>
                          </td>
                          
                          <td className="py-4 text-center">
                            <Link href={`/pelapor/reports/${item.id}`} className="inline-flex justify-center text-slate-400 hover:text-slate-700 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              </svg>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        )}
      </main>

      {/* ================= SIDEBAR KANAN ================= */}
      <aside className="hidden xl:block w-[400px] bg-slate-50 border-l border-slate-200 p-8 sticky top-0 h-[calc(100vh-88px)]">
        
        {/* Widget Kalender */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-blue-600">Kalender</h4>
          </div>
          
          <style>{`
            .rdp { --rdp-cell-size: 34px; margin: 0 auto; }
            .rdp-caption_label { font-size: 0.875rem; font-weight: 700; color: #1e293b; }
            .rdp-nav { display: flex; gap: 0.5rem; }
            .rdp-nav_button { width: 1.75rem; height: 1.75rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; background-color: transparent; }
            .rdp-button:focus, .rdp-button:active, .rdp-nav_button:focus { outline: none !important; box-shadow: none !important; border: none !important; background-color: transparent; }
            .rdp-nav_button:hover { background-color: #f1f5f9 !important; }
            .rdp-head_cell { font-size: 0.7rem; font-weight: 600; color: #94a3b8; padding-bottom: 0.5rem; }
            .rdp-day { font-size: 0.75rem; font-weight: 500; color: #475569; border-radius: 50% !important; cursor: pointer; }
            .rdp-day_sunday { color: #ef4444; }
            .rdp-day_today:not(.rdp-day_selected) { color: #2563eb; font-weight: 800; background-color: #eff6ff; }
            .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover { background-color: #2563eb !important; color: white !important; font-weight: 700; }
            .rdp-day:hover:not([disabled]):not(.rdp-day_selected) { background-color: #f1f5f9; }
          `}</style>
          
          <div className="flex justify-center text-sm">
            <DayPicker 
              mode="single" 
              selected={selectedDate} 
              onSelect={setSelectedDate}
              showOutsideDays
              modifiers={{ sunday: { dayOfWeek: [0] } }} 
              className="text-slate-700 w-full"
            />
          </div>
        </div>

        {/* Widget Status Laporan */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-slate-800">Status Laporan</h4>
            <p className="text-[10px] text-slate-400">Rekap Status laporan</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-xs font-medium text-blue-800">Laporan diverifikasi</span>
              </div>
              <span className="text-xs font-bold bg-blue-600 text-white px-4 py-1 rounded-full">
                {stats.verified}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                </div>
                <span className="text-xs font-medium text-slate-600">Laporan belum diverifikasi</span>
              </div>
              <span className="text-xs font-bold bg-slate-200 text-slate-600 px-4 py-1 rounded-full">
                {stats.unverified}
              </span>
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
}