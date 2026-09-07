"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

// Fungsi helper untuk memformat tanggal
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date);
};

export default function DetailLaporanAdminPage() {
  const { id } = useParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  
  // State untuk Preview PDF
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [loadingPdfId, setLoadingPdfId] = useState<number | null>(null);

  useEffect(() => {
    const fetchReportDetail = async () => {
      setIsLoading(true);
      const token = getCookie("token");
      
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setReportData(data.report || data);
        } else {
          alert("Gagal memuat detail laporan atau laporan tidak ditemukan.");
          router.push("/admin/dashboard");
        }
      } catch (error) {
        console.error("Terjadi kesalahan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchReportDetail();
    }
  }, [id, router]);

  // Fungsi untuk fetch PDF dengan otentikasi Token
  const handlePreviewPdf = async (questionId: number) => {
    setLoadingPdfId(questionId);
    const token = getCookie("token");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/${id}/attachments/${questionId}/view`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        // Ubah respons menjadi Blob (file biner)
        const blob = await res.blob();
        // Buat Object URL sementara untuk ditampilkan di iframe
        const objectUrl = URL.createObjectURL(blob);
        setSelectedPdfUrl(objectUrl);
      } else {
        const err = await res.json().catch(() => ({ message: "Gagal memuat dokumen." }));
        alert(err.message || "Gagal memuat dokumen.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan saat memuat dokumen.");
    } finally {
      setLoadingPdfId(null);
    }
  };

  // Fungsi tutup modal dan bersihkan memory
  const closePdfModal = () => {
    if (selectedPdfUrl) {
      URL.revokeObjectURL(selectedPdfUrl); // Mencegah memory leak
    }
    setSelectedPdfUrl(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  if (!reportData) return null;

  const answers = reportData.answers || [];
  const answeredCount = answers.filter((answer: any) => answer.answer_value !== null && answer.answer_value !== "").length;
  const totalScore = Number(reportData.total_score || 0);

  return (
    <div className="flex w-full h-full relative bg-slate-50">
      
      {/* ================= MAIN CONTENT (Daftar Form) ================= */}
      <main className="flex-1 px-8 lg:px-10 pb-10 pt-4 overflow-y-auto">
        
        {/* Header laporan */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" /></svg>
              </div>
              <h2 className="text-lg font-bold text-slate-800">Laporan, {reportData.user?.name || "Pelapor"}</h2>
            </div>
          </div>
          <button onClick={() => router.push("/admin")} className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-4 py-2 rounded-md transition-colors">
            Kembali ke beranda
          </button>
        </div>

        {/* Ringkasan laporan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mb-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5M7.5 16.5v-3m4.5 3V9m4.5 7.5V6" /></svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Total skor</p>
              <p className="text-2xl font-bold text-slate-800">{totalScore.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-700">
              <Image src="/images/chat.png" alt="Ikon total pertanyaan" width={28} height={28} className="w-7 h-7 object-contain" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Total pertanyaan</p>
              <p className="text-2xl font-bold text-slate-800">{answers.length}</p>
            </div>
          </div>
        </div>

        {/* List Jawaban Form */}
        <div className="space-y-6 max-w-4xl">
          {answers.map((ansItem: any, idx: number) => {
            const qData = ansItem.question || {};
            const qId = qData.id || ansItem.question_id;
            const isFile = ansItem.answer_type === "file";
            const isUrl = ansItem.answer_type === "url";
            const isPdfLoading = loadingPdfId === qId;
            const scoringRules = qData.scoring_rules || [];
            const hasScoringRules = scoringRules.length > 0;

            return (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <h4 className="text-[13px] font-bold text-slate-800 px-4 py-4 bg-white">
                  {idx + 1}. {qData.question_text || "Pertanyaan Tidak Diketahui"}
                </h4>
                
                <div className="border-t border-slate-100">
                  <div className={`grid ${hasScoringRules ? "grid-cols-[1fr_72px]" : "grid-cols-1"} bg-slate-50 px-4 py-2 text-[10px] font-bold text-blue-500`}>
                    <span>Jawaban</span>
                    {hasScoringRules && <span className="text-center">Score</span>}
                  </div>
                  
                  {hasScoringRules ? (
                    <div className="divide-y divide-slate-100">
                      {scoringRules.map((rule: any) => {
                        const isSelected = ansItem.answer_value === rule.answer_option;
                        return (
                          <div key={rule.id} className="grid grid-cols-[1fr_72px] items-center px-4 py-2.5 text-[10px] text-slate-700">
                            <div className="flex items-center gap-3">
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? "border-blue-300 bg-blue-50" : "border-slate-300"}`}>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                              </span>
                              <span className={isSelected ? "font-semibold text-slate-800" : ""}>{rule.answer_option}</span>
                            </div>
                            <span className="text-center font-semibold text-slate-700">{rule.score ?? 0}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : isFile ? (
                    <div className="flex items-center gap-3">
                      {ansItem.file_url ? (
                        <button 
                          onClick={() => handlePreviewPdf(qId)}
                          disabled={isPdfLoading}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors border border-blue-100 disabled:opacity-60"
                        >
                          {isPdfLoading ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                          )}
                          {isPdfLoading ? "Membuka..." : "Lihat Dokumen Terlampir"}
                        </button>
                      ) : (
                        <span className="text-sm font-medium text-slate-400 italic bg-slate-50 px-4 py-2 rounded-xl block w-fit border border-slate-100">
                          Tidak ada dokumen terlampir
                        </span>
                      )}
                    </div>
                  ) : isUrl ? (
                    <div className="bg-slate-50/70 px-4 py-4">
                       <a href={ansItem.answer_value} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline break-all">
                         {ansItem.answer_value || "-"}
                       </a>
                     </div>
                  ) : (
                    <div className="bg-slate-50/70 px-4 py-4 text-sm font-medium text-slate-700 break-words min-h-[46px] flex items-center">
                      {ansItem.answer_value || "-"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ================= SIDEBAR KANAN (Info Panel) ================= */}
      <aside className="hidden xl:block w-[320px] bg-slate-50 p-8 sticky top-0 h-[calc(100vh-88px)] flex-shrink-0">
        <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 p-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-5 mb-5">
            <div>
              <p className="font-bold text-sm text-slate-800">Status Laporan</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Rekap Status laporan</p>
            </div>
            <div className={`px-3 py-1 rounded-lg text-xs font-bold capitalize
              ${reportData.status === 'disetujui' ? 'bg-green-100 text-green-700' : 
                reportData.status === 'proses' ? 'bg-yellow-100 text-yellow-700' : 
                'bg-slate-100 text-slate-700'}
            `}>
              {reportData.status}
            </div>
          </div>
          <div className="space-y-5 border-b border-slate-100 pb-5 mb-5">
            <div>
              <p className="text-[10px] font-bold text-blue-400 mb-1">Terakhir Diedit</p>
              <p className="text-xs font-bold text-slate-800">{formatDate(reportData.updated_at)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-400 mb-1">Terakhir Diupload</p>
              <p className="text-xs font-bold text-slate-800">{formatDate(reportData.submitted_at)}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-blue-400 mb-2">Diupload Oleh</p>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight">{reportData.user?.name || "Nama Tidak Diketahui"}</p>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Pelapor</p>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">{reportData.user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ================= MODAL PREVIEW PDF ================= */}
      {selectedPdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-white w-full max-w-5xl h-full flex flex-col rounded-2xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                </div>
                <h3 className="font-bold text-slate-800">Pratinjau Dokumen PDF</h3>
              </div>
              <button 
                onClick={closePdfModal}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="Tutup Preview"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 bg-slate-100/50 p-2 md:p-4">
              <iframe 
                src={`${selectedPdfUrl}#toolbar=0`} 
                className="w-full h-full rounded-xl border border-slate-200 shadow-sm bg-white"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}