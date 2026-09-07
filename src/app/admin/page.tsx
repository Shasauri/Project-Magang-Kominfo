"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

export default function DashboardPage() {
  const [userName, setUserName] = useState("Admin");
  const [dashboardData, setDashboardData] = useState({ 
    total_users: 0, 
    total_reports: 0,
    approved_reports: 0,
    pending_reports: 0
  });
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ---------- STATE UNTUK MODAL CETAK & UBAH STATUS ----------
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [printReportData, setPrintReportData] = useState<any>(null);
  const [printEditStatus, setPrintEditStatus] = useState("");
  const [isLoadingPrintData, setIsLoadingPrintData] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  
  // State untuk mengontrol status loading saat mengunduh PDF individual
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);

  // ---------- STATE UNTUK MODAL CETAK REKAP LAPORAN ----------
  const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
  const [mediaTypes, setMediaTypes] = useState<any[]>([]);
  const [selectedMediaTypeId, setSelectedMediaTypeId] = useState<string>("");
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = getCookie("token");
      if (!token) return;

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      try {
        const [userRes, dashRes, reportsRes, mediaRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-types`, { headers }),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUserName(userData.name || "Nabila");
        }
        if (dashRes.ok) {
          setDashboardData(await dashRes.json());
        }
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setReports(reportsData.data || []);
        }
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          setMediaTypes(mediaData || []);
        }
      } catch (error) {
        console.error("Gagal mengambil data API", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  const openPrintModal = async (reportId: number) => {
    setIsPrintModalOpen(true);
    setSelectedReportId(reportId);
    setIsLoadingPrintData(true);
    setPrintReportData(null);

    const token = getCookie("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/${reportId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPrintReportData(data.report);
        setPrintEditStatus(data.report.status);
      }
    } catch (error) {
      console.error("Gagal memuat detail laporan", error);
    } finally {
      setIsLoadingPrintData(false);
    }
  };

  const closePrintModal = () => {
    setIsPrintModalOpen(false);
    setSelectedReportId(null);
    setPrintReportData(null);
  };

  const handleAutoUpdateStatus = async (newStatus: string) => {
    if (!selectedReportId) return;
    
    setPrintEditStatus(newStatus); 
    setIsStatusUpdating(true); 
    
    const token = getCookie("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/${selectedReportId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert("Gagal memperbarui status secara otomatis.");
      }
    } catch (error) {
      console.error("Error auto-update status:", error);
      alert("Terjadi kesalahan jaringan saat menyimpan status.");
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handlePrintOnly = async () => {
    if (!selectedReportId || !printReportData) return;
    setIsPrinting(true);
    const token = getCookie("token");
    const baseURL = process.env.NEXT_PUBLIC_API_URL;

    try {
      const pdfRes = await fetch(`${baseURL}/admin/reports/${selectedReportId}/pdf`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (pdfRes.ok) {
        const blob = await pdfRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Laporan_${printReportData.report_code || 'Media'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        closePrintModal();
      } else {
        alert("Terjadi kesalahan saat membuat file PDF.");
      }
    } catch (error) {
      console.error("Error cetak:", error);
      alert("Gagal memproses pengunduhan PDF.");
    } finally {
      setIsPrinting(false);
    }
  };

  // ---------- FUNGSI UNDUH PDF LAMPIRAN (DENGAN TOKEN) ----------
  const handleDownloadPdf = async (questionId: number) => {
    if (!selectedReportId) return;
    
    setDownloadingFileId(questionId);
    const token = getCookie("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/${selectedReportId}/attachments/${questionId}/download`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Dokumen_Bukti_${printReportData?.report_code || 'Media'}_Q${questionId}.pdf`; 
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const err = await res.json().catch(() => ({ message: "Gagal mengunduh dokumen." }));
        alert(err.message || "Gagal mengunduh dokumen.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan saat mengunduh dokumen.");
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    const token = getCookie("token");
    const baseURL = process.env.NEXT_PUBLIC_API_URL;

    let url = `${baseURL}/admin/export-excel`;
    if (selectedMediaTypeId) {
      url += `?media_type_id=${selectedMediaTypeId}`;
    }

    try {
      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        
        // Cari nama kategori media untuk nama file jika ada
        const selectedMedia = mediaTypes.find(t => String(t.id) === String(selectedMediaTypeId));
        const categoryLabel = selectedMedia ? selectedMedia.name.replace(/\s+/g, '_') : 'Semua';
        
        a.download = `Rekap_Laporan_Media_${categoryLabel}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        
        setIsRecapModalOpen(false);
      } else {
        const errData = await res.json().catch(() => null);
        alert(errData?.message || "Terjadi kesalahan saat mengunduh rekap Excel.");
      }
    } catch (error) {
      console.error("Error export excel:", error);
      alert("Gagal memproses pengunduhan Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  let modalMediaName = "-";
  let modalFiles: any[] = [];
  let modalLinks: any[] = [];

  if (printReportData && printReportData.answers) {
    const mediaNameAns = printReportData.answers.find((a: any) => 
      a.question?.question_text?.toLowerCase().includes("nama media")
    );
    if (mediaNameAns) modalMediaName = mediaNameAns.answer_value;

    modalFiles = printReportData.answers.filter((a: any) => a.answer_type === 'file' && a.answer_value);
    modalLinks = printReportData.answers.filter((a: any) => a.answer_type === 'url' && a.answer_value);
  }

  return (
    <div className="flex w-full h-full relative">
      <main className="flex-1 px-8 lg:px-10 pb-10 pt-2">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Selamat Datang, {userName}!</h2>

        {/* Card Widgets */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z" /></svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Data Pelapor</p>
              <h3 className="text-2xl font-bold text-slate-800">{dashboardData.total_users}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Data User Pelapor</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-400 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M7.5 5.25a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75c-2.73 0-5.36-.442-7.814-1.259-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.5 5.455V5.25Zm7.5 0v.25a49.112 49.112 0 0 0-6 0v-.25a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5Zm-3 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" /><path d="M3 18.4v-2.796a4.3 4.3 0 0 0 .713.31A26.226 26.226 0 0 0 12 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427-2.195 0-4.356-.145-6.477-.427C4.047 21.128 3 19.852 3 18.4Z" /></svg>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Data Laporan Media</p>
              <h3 className="text-2xl font-bold text-slate-800">{dashboardData.total_reports}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Seluruh Data Laporan Media</p>
            </div>
          </div>
        </div>

        {/* Tabel Laporan */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Daftar laporan media</h3>
              <p className="text-xs text-slate-400 mt-1">Memantau list laporan media dari pelapor</p>
            </div>
            
            <button 
              onClick={() => setIsRecapModalOpen(true)}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-[#009b77] hover:bg-[#008263] text-white font-bold text-xs shadow-md shadow-[#009b77]/25 transition-all cursor-pointer shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>
              Cetak Rekap Laporan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 border-b border-slate-100">
                  <th className="pb-4 font-medium">Kode Media</th>
                  <th className="pb-4 font-medium">Nama Media</th>
                  <th className="pb-4 font-medium">Tanggal di submit</th>
                  <th className="pb-4 font-medium">Tipe media</th>
                  <th className="pb-4 font-medium text-center">Kategori</th>
                  <th className="pb-4 font-medium text-center">Penilaian</th>
                  <th className="pb-4 font-medium text-center">Status</th>
                  <th className="pb-4 font-medium text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-400">Memuat data...</td></tr>
                ) : reports.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-slate-400">Belum ada laporan.</td></tr>
                ) : (
                  reports.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-medium text-slate-700">{item.report_code}</td>
                      <td className="py-4 text-slate-600">{item.media_name}</td>
                      <td className="py-4 text-slate-500">{item.submitted_at ? item.submitted_at.substring(0, 10) : '-'}</td>
                      <td className="py-4 text-slate-600">{item.media_type}</td>
                      <td className="py-4 text-center text-slate-600">{item.category}</td>
                      <td className="py-4 text-center font-semibold text-slate-700">{item.total_score}</td>
                      
                      <td className="py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          item.status === 'disetujui' ? 'bg-green-100 text-green-700' : 
                          item.status === 'proses' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.status === 'disetujui' ? 'Di Verifikasi' : 
                           item.status === 'proses' ? 'Di Proses' : 
                           'Pending'}
                        </span>
                      </td>
                      
                      <td className="py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Link href={`/admin/reports/${item.id}`} className="text-slate-400 hover:text-blue-600 transition-colors" title="Lihat Detail">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                          </Link>
                          
                          <button onClick={() => openPrintModal(item.id)} className="text-slate-400 hover:text-slate-600 transition-colors" title="Cetak & Ubah Status">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* SIDEBAR KANAN (Kalender & Status) */}
      <aside className="hidden xl:block w-[400px] bg-slate-50 border-l border-slate-200 p-8 sticky top-0 h-[calc(100vh-88px)">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
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
            .rdp-day_today:not(.rdp-day_selected) { color: #2563eb; font-weight: 800; background-color: #eff6ff; }
            .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover { background-color: #2563eb !important; color: white !important; font-weight: 700; }
            .rdp-day:hover:not([disabled]):not(.rdp-day_selected) { background-color: #f1f5f9; }
          `}</style>
          <div className="flex justify-center text-sm">
            <DayPicker mode="single" selected={selectedDate} onSelect={setSelectedDate} showOutsideDays className="text-slate-700 w-full" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
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
              <span className="text-xs font-bold bg-blue-600 text-white px-3 py-1 rounded-full">{dashboardData.approved_reports || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                </div>
                <span className="text-xs font-medium text-slate-600">Laporan belum diverifikasi</span>
              </div>
              <span className="text-xs font-bold bg-slate-200 text-slate-600 px-3 py-1 rounded-full">{dashboardData.pending_reports || 0}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MODAL CETAK & UBAH STATUS (AUTO-SAVE) ================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden relative">
            
            {/* Header Modal */}
            <div className="p-8 pb-6 border-b border-slate-100 flex items-center justify-between relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Cetak Hasil Laporan</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Lakukan Cetak Hasil Laporan</p>
                </div>
              </div>
              <button onClick={closePrintModal} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Indikator Loading Auto-Save */}
            {isStatusUpdating && (
              <div className="absolute top-[88px] left-0 right-0 z-10 flex justify-center">
                <div className="bg-slate-800 text-white text-xs font-medium px-4 py-1.5 rounded-b-lg shadow-md animate-pulse">
                  Menyimpan status baru...
                </div>
              </div>
            )}

            {/* Body Modal */}
            <div className="p-8 overflow-y-auto space-y-6 flex-1">
              {isLoadingPrintData ? (
                <div className="text-center py-10 text-slate-400 font-medium animate-pulse">Menyiapkan data laporan...</div>
              ) : (
                <>
                  {/* Row 1: Nama Media */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Nama Media <span className="text-red-500">*</span></label>
                    <input type="text" disabled value={modalMediaName} className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-medium text-sm outline-none" />
                  </div>

                  {/* Row 2: Grid File Bukti & Link */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* MODIFIKASI: BAGIAN FILE BUKTI SEKARANG MENGGUNAKAN FUNGSI UNDUH PDF */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">File Bukti <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        {modalFiles.length > 0 ? modalFiles.map((file, i) => {
                          const qId = file.question_id || file.question?.id;
                          const isDownloading = downloadingFileId === qId;
                          
                          return (
                            <button 
                              key={file.id}
                              onClick={() => handleDownloadPdf(qId)}
                              disabled={isDownloading}
                              className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="text-xs font-semibold text-slate-700 truncate mr-2">
                                {isDownloading ? "Mengunduh..." : `File Bukti ${i + 1}`}
                              </span>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 ${isDownloading ? 'animate-bounce' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                            </button>
                          );
                        }) : (
                          <div className="col-span-2 text-xs text-slate-400 py-3 italic">Tidak ada file terlampir.</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">Link <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        {modalLinks.length > 0 ? modalLinks.map((link) => (
                          <div key={link.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                            <a href={link.answer_value} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-slate-700 hover:text-blue-600 hover:underline truncate block w-full">
                              {link.answer_value}
                            </a>
                          </div>
                        )) : (
                          <div className="col-span-2 text-xs text-slate-400 py-3 italic">Tidak ada link terlampir.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Total Skor, Kategori, Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">TOTAL SKOR <span className="text-red-500">*</span></label>
                      <input type="text" disabled value={printReportData?.total_score ? parseFloat(printReportData.total_score).toFixed(2) : "0.00"} className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-bold text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">KATEGORI <span className="text-red-500">*</span></label>
                      <input type="text" disabled value={printReportData?.category || "-"} className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 font-bold text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">STATUS LAPORAN <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select
                          value={printEditStatus}
                          onChange={(e) => handleAutoUpdateStatus(e.target.value)}
                          disabled={isStatusUpdating}
                          className="block w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 font-semibold text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="disetujui">Di Verifikasi</option>
                          <option value="pending">Pending</option>
                          <option value="proses">Diproses</option>
                        </select>
                        <div className={`absolute top-1/2 -translate-y-1/2 left-4 w-2 h-2 rounded-full ${
                          printEditStatus === 'disetujui' ? 'bg-green-500' : printEditStatus === 'pending' ? 'bg-blue-500' : 'bg-orange-500'
                        }`}></div>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                        </div>
                        <style>{`select { padding-left: 2rem !important; }`}</style>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button 
                onClick={closePrintModal} 
                disabled={isPrinting || isLoadingPrintData}
                className="py-2.5 px-6 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Tutup
              </button>
              
              <button 
                onClick={handlePrintOnly}
                disabled={isPrinting || isLoadingPrintData || isStatusUpdating}
                className="py-2.5 px-6 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isPrinting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Memproses...
                  </>
                ) : (
                  "Cetak Laporan"
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}
      {/* ================= MODAL CETAK REKAP LAPORAN ================= */}
      {isRecapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden p-8 relative">
            
            {/* Tombol Close */}
            <button 
              onClick={() => setIsRecapModalOpen(false)} 
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>

            {/* Header Modal */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0a2.25 2.25 0 0 1-2.25 2.25H8.59a2.25 2.25 0 0 1-2.25-2.25M17.66 18H18.75c.621 0 1.125-.504 1.125-1.125V11.25c0-1.242-1.003-2.25-2.25-2.25H6.375c-1.242 0-2.25 1.008-2.25 2.25v5.625c0 .621.504 1.125 1.125 1.125H6.34m12.31-6.75H5.34m13.31-6.75H5.34m-3.46-3.75h.008v.008H15V8.25Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cetak Rekap Laporan</h2>
                <p className="text-xs text-slate-500 mt-0.5">Lakukan Cetak Hasil Laporan</p>
              </div>
            </div>

            {/* Deskripsi */}
            <div className="mb-6 space-y-1">
              <p className="text-xs text-slate-500 font-medium">
                Mencetak rekap laporan berdasarkan Filter Kategori Media
              </p>
              <p className="text-[11px] text-slate-400 italic">
                *Laporan hasil rekap akan dicetak kedalam bentuk .xlsx
              </p>
            </div>

            {/* Input Dropdown */}
            <div className="mb-8">
              <div className="relative">
                <select
                  value={selectedMediaTypeId}
                  onChange={(e) => setSelectedMediaTypeId(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 font-medium text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="">Filter Kategori Media</option>
                  {mediaTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={() => setIsRecapModalOpen(false)} 
                disabled={isExportingExcel}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Kembali
              </button>
              <button 
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExportingExcel ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Memproses...
                  </>
                ) : (
                  "Cetak"
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}