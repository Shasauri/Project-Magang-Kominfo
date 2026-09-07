"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Helper Token
const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

// Helper menentukan tipe jawaban dari teks pertanyaan
const determineAnswerType = (questionText: string) => {
  const text = questionText.toLowerCase();
  if (text.includes("upload") || text.includes("file")) return "file";
  if (text.includes("link") || text.includes("url")) return "url";
  return "text";
};

export default function DetailEditLaporanPage() {
  const { id } = useParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveSuccessOpen, setIsSaveSuccessOpen] = useState(false);
  
  const [reportData, setReportData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  
  // State untuk form edit
  const [answersForm, setAnswersForm] = useState<{ [key: number]: { value: string, type: string, fileName?: string } }>({});
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: number]: boolean }>({});

  // 1. Load Data Laporan & Pertanyaan
  const fetchData = async () => {
    setIsLoading(true);
    const token = getCookie("token");
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    
    try {
      // Fetch detail laporan
      const reportRes = await fetch(`${baseURL}/reports/${id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!reportRes.ok) {
        alert("Laporan tidak ditemukan atau Anda tidak memiliki akses.");
        router.push("/pelapor");
        return;
      }
      
      const reportJson = await reportRes.json();
      const report = reportJson.report || reportJson;
      setReportData(report);

      // Fetch daftar pertanyaan berdasarkan media_type_id dari laporan ini
      const qRes = await fetch(`${baseURL}/evaluation-questions/${report.media_type_id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (qRes.ok) {
        const qData = await qRes.json();
        setQuestions(qData);
      }

      // Format data jawaban ke state form
      const initialAnswers: any = {};
      if (report.answers && Array.isArray(report.answers)) {
        report.answers.forEach((ans: any) => {
          initialAnswers[ans.question_id] = {
            value: ans.answer_value,
            type: ans.answer_type,
            fileName: ans.answer_type === 'file' && ans.answer_value ? ans.answer_value.split('/').pop() : ''
          };
        });
      }
      setAnswersForm(initialAnswers);

    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  // 2. Handler Perubahan Form
  const handleTextChange = (qId: number, value: string, questionText: string) => {
    const type = determineAnswerType(questionText);
    setAnswersForm(prev => ({ ...prev, [qId]: { value, type } }));
  };

  // 3. Handler Upload File On-The-Fly
  const handleFileUpload = async (qId: number, file: File) => {
    setUploadingFiles(prev => ({ ...prev, [qId]: true }));
    const token = getCookie("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}/upload/${qId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const newValue = data.answer_value || data.answer?.answer_value || data.path || data.url;
        
        setAnswersForm(prev => ({ 
          ...prev, 
          [qId]: { value: newValue, type: "file", fileName: file.name } 
        }));
      } else {
        const err = await res.json();
        alert(err.message || "Gagal mengunggah file. Pastikan format PDF & maks 5MB.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan saat mengunggah file.");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [qId]: false }));
    }
  };

  // 4. Aksi Batal Edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Kembalikan data dari backup reportData asli
    const initialAnswers: any = {};
    reportData.answers.forEach((ans: any) => {
      initialAnswers[ans.question_id] = {
        value: ans.answer_value,
        type: ans.answer_type,
        fileName: ans.answer_type === 'file' && ans.answer_value ? ans.answer_value.split('/').pop() : ''
      };
    });
    setAnswersForm(initialAnswers);
  };

  // 5. Simpan Perubahan (Submit PUT Request)
  const handleSaveChanges = async () => {
    setIsSaving(true);
    const token = getCookie("token");
    
    // Susun jawaban (hanya ambil yang terisi)
    const formattedAnswers: any[] = [];
    Object.entries(answersForm).forEach(([qId, data]) => {
      if (data && data.value !== "") {
        formattedAnswers.push({
          question_id: Number(qId),
          answer_value: data.value,
          answer_type: data.type
        });
      }
    });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ answers: formattedAnswers })
      });

      if (res.ok) {
        setIsEditing(false);
        setIsSaveSuccessOpen(true);
      } else {
        const err = await res.json();
        alert(err.message || "Gagal menyimpan perubahan laporan.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  if (!reportData) return null;

  const handleSaveSuccessConfirm = () => {
    setIsSaveSuccessOpen(false);
    fetchData(); // Refresh setelah notifikasi ditutup agar modal tetap terlihat.
  };

  const answeredCount = Object.values(answersForm).filter(a => a && a.value !== "").length;
  const totalQuestions = questions.length;
  const isPending = reportData.status === "pending";

  return (
    <div className="flex w-full h-full relative bg-slate-50">
      {isSaveSuccessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="flex min-h-[153px] w-full max-w-sm flex-col items-center justify-center rounded-2xl bg-white px-8 py-6 text-center shadow-xl">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-900">Perubahan Berhasil Disimpan</p>
            <button
              type="button"
              onClick={handleSaveSuccessConfirm}
              className="mt-5 w-28 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
      
      {/* ================= MAIN CONTENT KIRI ================= */}
      <main className="flex-1 px-8 lg:px-10 pb-10 pt-4 overflow-y-auto">
        
        {/* Header Title (Pengisian Form) */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.push("/pelapor")}
            className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-4 py-2 rounded-md transition-colors"
          >
            Kembali ke beranda
          </button>
        </div>

        {/* Info Card (Sesuai Gambar Terbaru) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between mb-8 max-w-4xl">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium">Pertanyaan yang dijawab</p>
              <h3 className="text-2xl font-bold text-slate-800">{answeredCount}/{totalQuestions}</h3>
            </div>
          </div>
          
          <div className="px-5 py-2.5 bg-orange-400 text-white rounded-lg text-[11px] font-bold shadow-sm capitalize">
            Status Laporan: {reportData.status}
          </div>
        </div>

        {/* List Pertanyaan Form */}
        <div className="space-y-6 max-w-4xl">
          {questions.map((q, idx) => {
            const qType = determineAnswerType(q.question_text);
            const hasOptions = q.scoring_rules && q.scoring_rules.length > 0;
            const ansState = answersForm[q.id];
            const isUploading = uploadingFiles[q.id];

            return (
              <div key={q.id} className={`bg-white rounded-3xl p-6 shadow-sm border ${isEditing ? 'border-blue-100 ring-1 ring-blue-50' : 'border-slate-100'} transition-all`}>
                <h4 className="text-sm font-bold text-slate-800 mb-4">
                  {idx + 1}. {q.question_text} {q.is_mandatory && <span className="text-red-500">*</span>}
                </h4>
                <div className="border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-bold text-blue-600 block mb-4">Jawaban</span>
                  
                  {/* Tipe: Radio Button */}
                  {hasOptions && (
                    <div className="flex flex-col gap-3 pl-2">
                      {q.scoring_rules.map((rule: any) => (
                        <label key={rule.id} className={`flex items-center gap-3 group ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-90'}`}>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${ansState?.value === rule.answer_option ? 'border-blue-600' : 'border-slate-300'}`}>
                            {ansState?.value === rule.answer_option && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                          </div>
                          <input 
                            type="radio" 
                            name={`q-${q.id}`} 
                            value={rule.answer_option} 
                            disabled={!isEditing}
                            className="hidden"
                            onChange={() => handleTextChange(q.id, rule.answer_option, q.question_text)}
                          />
                          <span className={`text-xs font-semibold ${!isEditing ? 'text-slate-500' : 'text-slate-700'}`}>{rule.answer_option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Tipe: File Upload */}
                  {!hasOptions && qType === "file" && (
                    <div>
                      {isEditing && <p className="text-[10px] text-slate-400 mb-3">Upload 1 file yang didukung: PDF. Maks 5 MB.</p>}
                      <div className="flex items-center gap-4">
                        
                        {/* Tombol Upload (Hanya saat isEditing) */}
                        {isEditing && (
                          <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 border text-xs font-bold rounded-lg transition-colors ${isUploading ? 'border-slate-300 text-slate-400 cursor-not-allowed' : 'border-blue-600 text-blue-600 hover:bg-blue-50'}`}>
                            {isUploading ? "Mengunggah..." : (ansState?.fileName ? "Ganti File" : "Tambahkan File")}
                            <input 
                              type="file" 
                              accept=".pdf"
                              disabled={isUploading || !isEditing}
                              className="hidden" 
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileUpload(q.id, e.target.files[0]);
                                }
                              }} 
                            />
                          </label>
                        )}
                        
                        {/* Status File Tersimpan */}
                        {ansState?.fileName && !isUploading && (
                          <a 
                            href={`${process.env.NEXT_PUBLIC_API_URL}/storage/${ansState.value}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs text-blue-600 font-semibold truncate flex items-center gap-1 hover:underline decoration-blue-600"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                            {ansState.fileName}
                          </a>
                        )}

                        {!isEditing && !ansState?.fileName && (
                          <span className="text-xs text-slate-400 font-medium italic">Tidak ada file yang dilampirkan</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tipe: Text Biasa / URL */}
                  {!hasOptions && qType !== "file" && (
                    <input 
                      type="text"
                      value={ansState?.value || ""}
                      disabled={!isEditing}
                      onChange={(e) => handleTextChange(q.id, e.target.value, q.question_text)}
                      placeholder={isEditing ? "Jawaban anda" : "-"}
                      className={`w-full py-2 text-xs font-medium bg-transparent transition-colors outline-none
                        ${!isEditing 
                          ? 'border-none text-slate-500 cursor-not-allowed' 
                          : 'border-b border-slate-300 focus:border-blue-600 text-slate-700'
                        }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ================= SIDEBAR KANAN ================= */}
      <aside className="hidden xl:block w-[340px] bg-slate-50 border-l border-slate-200 p-8 sticky top-0 h-[calc(100vh-88px)] flex-shrink-0">
        
        {/* Card Tracker Pertanyaan */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col mb-4">
          <h4 className="font-bold text-sm text-slate-800 mb-6">Pertanyaan yang Terjawab</h4>
          
          <div className="grid grid-cols-5 gap-3">
            {questions.map((q, idx) => {
              const isAnswered = answersForm[q.id] && answersForm[q.id].value !== "";
              return (
                <div 
                  key={q.id}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isAnswered 
                      ? "bg-green-500 text-white border-transparent" 
                      : "bg-white text-blue-600 border border-slate-100"
                  }`}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* Kumpulan Tombol Aksi (Tampil berdasarkan State Edit) */}
        <div className="flex flex-col gap-3">
          
          {/* Tampilan awal (Hanya tampil "Edit Form" jika status Pending) */}
          {!isEditing && isPending && (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full bg-[#16C542] hover:bg-green-600 text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm"
            >
              Edit Form
            </button>
          )}

          {/* Tampilan jika tombol Edit diklik (Tampil Batal & Simpan) */}
          {isEditing && (
            <>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsEditing(true)}
                  disabled
                  className="flex-1 bg-[#16C542] text-white font-bold text-sm py-3.5 rounded-xl shadow-sm opacity-50 cursor-not-allowed"
                >
                  Edit Form
                </button>
                <button 
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  Batalkan Edit
                </button>
              </div>
              <button 
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving && (
                   <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                )}
                Simpan Perubahan
              </button>
            </>
          )}
          
        </div>

      </aside>
    </div>
  );
}