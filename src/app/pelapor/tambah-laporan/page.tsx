"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const getCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
};

// Helper menentukan answer_type dari teks pertanyaan
const determineAnswerType = (questionText: string) => {
  const text = questionText.toLowerCase();
  if (text.includes("upload") || text.includes("file")) return "file";
  if (text.includes("link") || text.includes("url")) return "url";
  return "text";
};

const isNegativeAnswer = (value: string | undefined) => {
  if (!value) return false;
  const normalizedValue = value.trim().toLowerCase();
  return normalizedValue.startsWith("tidak") || normalizedValue === "ada tanpa ukw";
};

const isSkippedWhenPreviousAnswerIsNo = (question: any) => {
  const answerType = determineAnswerType(question.question_text);
  return answerType === "file" || answerType === "url";
};

const requiredQuestionIds = new Set([9, 15]);

function TambahLaporanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startedQueryRef = useRef<string | null>(null);

  // State Alur
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitNotification, setSubmitNotification] = useState<"success" | "incomplete" | "error" | null>(null);
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");

  // State Data Tahap 1
  const [mediaTypes, setMediaTypes] = useState<any[]>([]);
  const [selectedMediaType, setSelectedMediaType] = useState("");
  const [mediaName, setMediaName] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // State Data Tahap 2
  const [questions, setQuestions] = useState<any[]>([]);
  // answers menyimpan tipe, value (string path/teks), dan nama file asli (untuk UI)
  const [answers, setAnswers] = useState<{ [key: number]: { value: string, type: string, fileName?: string } }>({});
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchMediaTypes = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media-types`);
        if (res.ok) {
          const data = await res.json();
          setMediaTypes(data);
        }
      } catch (error) {
        console.error("Gagal mengambil jenis media:", error);
      }
    };
    fetchMediaTypes();
  }, []);

  // ---------------------------------------------------------
  // 1. TAHAP 1: FETCH PERTANYAAN
  // ---------------------------------------------------------
  const startReport = async (mediaTypeId: string, reportMediaName: string, reportContactNumber: string) => {
    if (!mediaTypeId || !reportMediaName.trim() || !reportContactNumber.trim()) {
      alert("Harap lengkapi jenis media, nama media, dan nomor yang dapat dihubungi.");
      return;
    }

    setIsLoading(true);
    const token = getCookie("token");
    const baseURL = process.env.NEXT_PUBLIC_API_URL;

    try {
      // A. Ambil daftar pertanyaan
      const qRes = await fetch(`${baseURL}/evaluation-questions/${mediaTypeId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!qRes.ok) throw new Error("Gagal mengambil pertanyaan");
      const qData = await qRes.json();
      setQuestions(qData);

      // Simpan nama media secara lokal sampai laporan benar-benar disubmit.
      const namaMediaQ = qData.find((q: any) => q.question_text.toLowerCase().includes("nama media"));
      const contactQ = qData.find((q: any) => {
        const text = q.question_text.toLowerCase();
        return text.includes("whatsapp") || text.includes("kontak");
      });
      const initialAnswers: { [key: number]: { value: string, type: string } } = {};

      if (namaMediaQ) initialAnswers[namaMediaQ.id] = { value: reportMediaName.trim(), type: "text" };
      if (contactQ) initialAnswers[contactQ.id] = { value: reportContactNumber.trim(), type: "text" };

      setAnswers(initialAnswers);
      
      setStep(2);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Terjadi kesalahan sistem saat memproses.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    startReport(selectedMediaType, mediaName, contactNumber);
  };

  useEffect(() => {
    const mediaTypeId = searchParams.get("media_type_id");
    const reportMediaName = searchParams.get("media_name");
    const reportContactNumber = searchParams.get("contact_number");
    const queryKey = mediaTypeId && reportMediaName && reportContactNumber
      ? `${mediaTypeId}:${reportMediaName}:${reportContactNumber}`
      : null;

    if (mediaTypeId && reportMediaName && reportContactNumber && step === 1 && startedQueryRef.current !== queryKey) {
      startedQueryRef.current = queryKey;
      setSelectedMediaType(mediaTypeId);
      setMediaName(reportMediaName);
      setContactNumber(reportContactNumber);
      startReport(mediaTypeId, reportMediaName, reportContactNumber);
    }
  }, [searchParams, step]);

  // ---------------------------------------------------------
  // 2. HANDLER: TEKS & UPLOAD FILE PER PERTANYAAN
  // ---------------------------------------------------------
  const handleTextChange = (qId: number, value: string, questionText: string) => {
    const type = determineAnswerType(questionText);
    setAnswers(prev => {
      const nextAnswers = { ...prev, [qId]: { value, type } };
      const questionIndex = questions.findIndex((question) => question.id === qId);
      const nextQuestion = questions[questionIndex + 1];

      if (
        isNegativeAnswer(value) &&
        nextQuestion &&
        isSkippedWhenPreviousAnswerIsNo(nextQuestion)
      ) {
        delete nextAnswers[nextQuestion.id];
      }

      return nextAnswers;
    });
  };

  const handleFileUpload = async (qId: number, file: File) => {
    setUploadingFiles(prev => ({ ...prev, [qId]: true }));
    const token = getCookie("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Upload file sebelum laporan dibuat; path-nya dikirim saat submit final.
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/upload/${qId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setAnswers(prev => ({ 
          ...prev,
          [qId]: { value: data.file_path, type: "file", fileName: file.name }
        }));
      } else {
        const err = await res.json();
        alert(err.message || "Gagal mengunggah file. Silakan coba lagi.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan saat mengunggah.");
    } finally {
      setUploadingFiles(prev => ({ ...prev, [qId]: false }));
    }
  };

  // ---------------------------------------------------------
  // 3. TAHAP 3: FINALISASI & SUBMIT LAPORAN
  // ---------------------------------------------------------
  const handleSubmitLaporan = async () => {
    setIsSubmitModalOpen(false);
    setSubmitNotification(null);
    setSubmitErrorMessage("");

    const unansweredMandatory = visibleQuestions.filter(
      (q) => (q.is_mandatory || requiredQuestionIds.has(q.id)) && (!answers[q.id] || !answers[q.id].value?.trim())
    );
    
    if (unansweredMandatory.length > 0) {
      setSubmitNotification("incomplete");
      return;
    }

    setIsSubmitting(true);
    const token = getCookie("token");
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    
    // Susun array jawaban yang sudah rapi
    const formattedAnswers = Object.entries(answers).map(([qId, data]) => ({
      question_id: Number(qId),
      answer_value: data.value,
      answer_type: data.type
    }));

    try {
      // Buat dan submit laporan dalam satu request setelah form lengkap.
      const submitRes = await fetch(`${baseURL}/reports`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          media_type_id: Number(selectedMediaType),
          submit: true,
          answers: formattedAnswers
        })
      });

      if (submitRes.ok) {
        setSubmitNotification("success");
      } else {
        const err = await submitRes.json();
        throw new Error(err.message || "Gagal finalisasi laporan");
      }
    } catch (error: any) {
      console.error(error);
      setSubmitErrorMessage(error.message || "Terjadi kesalahan saat submit.");
      setSubmitNotification("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleQuestions = questions.filter((question, index) => {
    if (index === 0 || !isSkippedWhenPreviousAnswerIsNo(question)) return true;

    const previousAnswer = answers[questions[index - 1].id]?.value;
    return !isNegativeAnswer(previousAnswer);
  });

  const answeredCount = visibleQuestions.filter((question) => answers[question.id]?.value !== "").length;
  const totalQuestions = visibleQuestions.length;

  return (
    <div className="flex w-full h-full relative bg-slate-50">
      
      {/* ================= TAHAP 1: MODAL PILIH MEDIA ================= */}
      {step === 1 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden p-8">
            <h2 className="text-xl font-bold text-slate-900">Tambah Laporan Media Baru</h2>
            <p className="text-xs text-slate-500 mt-1 mb-8">Pilih jenis media dan nama media yang ingin dilaporkan</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Pilih jenis media <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select 
                    value={selectedMediaType}
                    onChange={(e) => setSelectedMediaType(e.target.value)}
                    className="block w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-blue-500 outline-none cursor-pointer"
                  >
                    <option value="" disabled>Pilih Jenis Media</option>
                    {mediaTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Nama Media <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  value={mediaName}
                  onChange={(e) => setMediaName(e.target.value)}
                  placeholder="Masukkan nama media"
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-10">
              <Link href="/pelapor" className="py-2.5 px-6 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
                Batal
              </Link>
              <button 
                onClick={handleNextStep}
                disabled={isLoading}
                className="py-2.5 px-6 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Memproses..." : "Selanjutnya"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAHAP 2: PENGISIAN FORM ================= */}
      {step === 2 && (
        <>
          <main className="flex-1 px-8 lg:px-10 pb-10 pt-4 overflow-y-auto">
            {/* Header Form */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 mb-8 w-fit pr-16">
              <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium">Pertanyaan yang dijawab</p>
                <h3 className="text-2xl font-bold text-slate-800">{answeredCount}/{totalQuestions}</h3>
              </div>
            </div>

            {/* List Pertanyaan */}
            <div className="space-y-6">
              {visibleQuestions.map((q, idx) => {
                const qType = determineAnswerType(q.question_text);
                const hasOptions = q.scoring_rules && q.scoring_rules.length > 0;
                const ans = answers[q.id];
                const isUploading = uploadingFiles[q.id];

                return (
                  <div key={q.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 mb-4">{idx + 1}. {q.question_text} {requiredQuestionIds.has(q.id) && <span className="text-red-500">*</span>}</h4>
                    <div className="border-t border-slate-100 pt-4">
                      <span className="text-[10px] font-bold text-blue-600 block mb-4">Jawaban</span>
                      
                      {/* Tipe: Radio Button */}
                      {hasOptions && (
                        <div className="flex flex-col gap-3 pl-2">
                          {q.scoring_rules.map((rule: any) => (
                            <label key={rule.id} className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${ans?.value === rule.answer_option ? 'border-blue-600' : 'border-slate-300'}`}>
                                {ans?.value === rule.answer_option && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}
                              </div>
                              <input 
                                type="radio" 
                                name={`q-${q.id}`} 
                                value={rule.answer_option} 
                                className="hidden"
                                onChange={() => handleTextChange(q.id, rule.answer_option, q.question_text)}
                              />
                              <span className="text-xs font-semibold text-slate-700">{rule.answer_option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Tipe: File Upload */}
                      {!hasOptions && qType === "file" && (
                        <div>
                          <p className="text-[10px] text-slate-400 mb-3">Upload 1 file yang didukung: PDF. Maks 5 MB.</p>
                          <div className="flex items-center gap-4">
                            <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 border text-xs font-bold rounded-lg transition-colors ${isUploading ? 'border-slate-300 text-slate-400 cursor-not-allowed' : 'border-blue-600 text-blue-600 hover:bg-blue-50'}`}>
                              {isUploading ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                              )}
                              {isUploading ? "Mengunggah..." : "Tambahkan File"}
                              <input 
                                type="file" 
                                accept=".pdf"
                                disabled={isUploading}
                                className="hidden" 
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleFileUpload(q.id, e.target.files[0]);
                                  }
                                }} 
                              />
                            </label>
                            
                            {ans?.fileName && !isUploading && (
                              <span className="text-xs text-green-600 font-semibold truncate flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
                                {ans.fileName}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tipe: Text Input Biasa / URL */}
                      {!hasOptions && qType !== "file" && (
                        <input 
                          type="text"
                          value={ans?.value || ""}
                          onChange={(e) => handleTextChange(q.id, e.target.value, q.question_text)}
                          placeholder="Jawaban anda"
                          className="w-full border-b border-slate-300 focus:border-blue-600 outline-none py-2 text-xs font-medium text-slate-700 bg-transparent transition-colors"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* SIDEBAR KANAN (Tracker Pertanyaan) */}
          <aside className="hidden xl:block w-[340px] bg-slate-50 border-l border-slate-200 p-8 sticky top-0 h-[calc(100vh-88px)]">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col h-full">
              <h4 className="font-bold text-sm text-slate-800 mb-6">Pertanyaan yang Terjawab</h4>
              
              <div className="grid grid-cols-5 gap-3 mb-8">
                {visibleQuestions.map((q, idx) => {
                  const isAnswered = answers[q.id] && answers[q.id].value !== "";
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

              <div className="mt-auto">
                <button 
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors shadow-sm"
                >
                  Submit Laporan
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ================= MODAL SUBMIT LAPORAN ================= */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl overflow-hidden p-8 text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Apakah kamu yakin ingin submit laporan??</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-8 px-4">
              Anda masih dapat mengedit nya selagi status dalam keadaan pending dan belum di proses
            </p>
            
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={() => setIsSubmitModalOpen(false)} 
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleSubmitLaporan} 
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors flex justify-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= NOTIFIKASI HASIL SUBMIT ================= */}
      {submitNotification && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4">
          <div className="flex min-h-[220px] w-full max-w-sm flex-col items-center justify-center rounded-2xl bg-white px-8 py-7 text-center shadow-xl">
            {submitNotification === "incomplete" || submitNotification === "error" ? (
              <>
                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-1.5a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 16.5h.008v.008H12V16.5Z" />
                  </svg>
                </div>
                <p className="max-w-[240px] text-sm font-bold leading-snug text-slate-900">
                  {submitNotification === "incomplete"
                    ? "Harap lengkapi pertanyaan nomor 9 dan 15 sebelum melakukan submit."
                    : submitErrorMessage}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitNotification(null)}
                  className="mt-7 rounded-lg bg-red-600 px-7 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                >
                  Kembali ke form
                </button>
              </>
            ) : (
              <>
                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-900">Form Berhasil disubmit</p>
                <button
                  type="button"
                  onClick={() => router.push("/pelapor")}
                  className="mt-7 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Kembali ke dashboard
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TambahLaporanPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-sm text-slate-600">Memuat formulir laporan...</p></div>}>
      <TambahLaporanContent />
    </Suspense>
  );
}