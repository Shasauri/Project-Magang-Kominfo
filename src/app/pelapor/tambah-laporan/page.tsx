"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

const getResponseErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    if (data?.message) return data.message;
    const errors = data?.errors ? Object.values(data.errors).flat().join(" ") : "";
    return errors || fallback;
  } catch {
    return fallback;
  }
};

const requiredQuestionIds = new Set([9, 15]);

const isRequiredQuestion = (question: any) => {
  const questionText = question.question_text?.toLowerCase() || "";
  return (
    question.is_mandatory ||
    requiredQuestionIds.has(question.id) ||
    questionText.includes("link sosial media")
  );
};

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
  const [pendingFiles, setPendingFiles] = useState<{ [key: number]: File }>({});
  const [uploadingFiles] = useState<{ [key: number]: boolean }>({});
  const [fileErrors, setFileErrors] = useState<{ [key: number]: string }>({});

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
    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    // Validasi tipe file
    if (file.type !== "application/pdf") {
      setFileErrors(prev => ({ ...prev, [qId]: "Hanya file PDF yang diizinkan." }));
      setPendingFiles(prev => { const next = { ...prev }; delete next[qId]; return next; });
      setAnswers(prev => { const next = { ...prev }; delete next[qId]; return next; });
      return;
    }

    // Validasi ukuran file (maks 5 MB)
    if (file.size > MAX_SIZE_BYTES) {
      setFileErrors(prev => ({ ...prev, [qId]: `Ukuran file melebihi batas maksimal ${MAX_SIZE_MB} MB. Ukuran file saat ini: ${(file.size / 1024 / 1024).toFixed(2)} MB.` }));
      setPendingFiles(prev => { const next = { ...prev }; delete next[qId]; return next; });
      setAnswers(prev => { const next = { ...prev }; delete next[qId]; return next; });
      return;
    }

    // File valid — hapus error lama lalu simpan
    setFileErrors(prev => { const next = { ...prev }; delete next[qId]; return next; });
    setPendingFiles(prev => ({ ...prev, [qId]: file }));
    setAnswers(prev => ({ ...prev, [qId]: { value: "", type: "file", fileName: file.name } }));
  };

  // ---------------------------------------------------------
  // 3. TAHAP 3: FINALISASI & SUBMIT LAPORAN
  // ---------------------------------------------------------
  const handleSubmitLaporan = async () => {
    setIsSubmitModalOpen(false);
    setSubmitNotification(null);
    setSubmitErrorMessage("");

    const unansweredMandatory = visibleQuestions.filter(
      (q) => isRequiredQuestion(q) && (
        (!answers[q.id] || !answers[q.id].value?.trim()) && !pendingFiles[q.id]
      )
    );
    
    if (unansweredMandatory.length > 0) {
      const unansweredNumbers = unansweredMandatory.map(
        (question) => visibleQuestions.findIndex((item) => item.id === question.id) + 1
      );
      const formattedNumbers = unansweredNumbers.length === 1
        ? `${unansweredNumbers[0]}`
        : `${unansweredNumbers.slice(0, -1).join(", ")} dan ${unansweredNumbers[unansweredNumbers.length - 1]}`;

      setSubmitErrorMessage(
        `Harap lengkapi pertanyaan nomor ${formattedNumbers} sebelum melakukan submit.`
      );
      setSubmitNotification("incomplete");
      return;
    }

    setIsSubmitting(true);
    const token = getCookie("token");
    const baseURL = process.env.NEXT_PUBLIC_API_URL;
    
    const formattedAnswers = Object.entries(answers)
      .filter(([, data]) => data.type !== "file" && data.value.trim())
      .map(([qId, data]) => ({
        question_id: Number(qId),
        answer_value: data.value,
        answer_type: data.type
      }));

    try {
      // Buat draft lebih dulu agar backend memiliki reportId untuk upload file.
      const draftRes = await fetch(`${baseURL}/reports`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          media_type_id: Number(selectedMediaType),
          submit: false,
          answers: formattedAnswers
        })
      });

      if (!draftRes.ok) {
        throw new Error(await getResponseErrorMessage(draftRes, "Gagal membuat draft laporan."));
      }

      const draftData = await draftRes.json();
      const reportId = draftData.report?.id || draftData.id;
      if (!reportId) throw new Error("Respons pembuatan laporan tidak memiliki ID laporan.");

      for (const [qId, file] of Object.entries(pendingFiles)) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch(`${baseURL}/reports/${reportId}/upload/${qId}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });

        if (!uploadRes.ok) {
          throw new Error(await getResponseErrorMessage(uploadRes, `Gagal mengunggah file pertanyaan ${qId}.`));
        }
      }

      const submitRes = await fetch(`${baseURL}/reports/${reportId}/submit`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!submitRes.ok) {
        throw new Error(await getResponseErrorMessage(submitRes, "Gagal finalisasi laporan."));
      }

      setSubmitNotification("success");
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

  const isQuestionAnswered = (qId: number) => {
    const ans = answers[qId];
    if (pendingFiles[qId]) return true;
    if (!ans) return false;
    if (ans.type === "file") return Boolean(ans.fileName || (ans.value && ans.value.trim() !== ""));
    return Boolean(ans.value && ans.value.trim() !== "");
  };

  const answeredCount = visibleQuestions.filter((question) => isQuestionAnswered(question.id)).length;
  const totalQuestions = visibleQuestions.length;

  return (
    <div className="flex w-full h-full relative bg-slate-50">
      
      {/* ================= TAHAP 1: MODAL PILIH MEDIA ================= */}
      {step === 1 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl rounded-3xl p-8">
            <h2 className="text-xl font-bold text-slate-900">Tambah Laporan Media Baru</h2>
            <p className="mt-1 mb-8 text-xs text-slate-500">Pilih jenis media dan nama media yang ingin dilaporkan</p>
            
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
              <Button
                onClick={handleNextStep}
                disabled={isLoading}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm text-white hover:bg-blue-700"
              >
                {isLoading ? "Memproses..." : "Selanjutnya"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ================= TAHAP 2: PENGISIAN FORM ================= */}
      {step === 2 && (
        <>
          <main className="flex-1 px-8 lg:px-10 pb-10 pt-4 overflow-y-auto">
            {/* Header Form */}
            <Card className="mb-8 flex w-fit flex-row items-center gap-5 rounded-3xl border border-slate-100 p-6 pr-16">
              <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium">Pertanyaan yang dijawab</p>
                <h3 className="text-2xl font-bold text-slate-800">{answeredCount}/{totalQuestions}</h3>
              </div>
            </Card>

            {/* List Pertanyaan */}
            <div className="space-y-6">
              {visibleQuestions.map((q, idx) => {
                const qType = determineAnswerType(q.question_text);
                const hasOptions = q.scoring_rules && q.scoring_rules.length > 0;
                const ans = answers[q.id];
                const isUploading = uploadingFiles[q.id];

                return (
                  <Card key={q.id} className="rounded-3xl border border-slate-100 p-6">
                    <h4 className="text-sm font-bold text-slate-800 mb-4">{idx + 1}. {q.question_text} {isRequiredQuestion(q) && <span className="text-red-500">*</span>}</h4>
                    <div className="border-t border-slate-100 pt-4">
                      <span className="text-[10px] font-bold text-blue-600 block mb-4">Jawaban</span>
                      
                      {/* Tipe: Radio Button */}
                      {hasOptions && (
                        <RadioGroup
                          value={ans?.value || ""}
                          onValueChange={(value) => handleTextChange(q.id, value, q.question_text)}
                          className="flex flex-col gap-3 pl-2"
                        >
                          {q.scoring_rules.map((rule: any) => (
                            <label key={rule.id} className="flex cursor-pointer items-center gap-3 text-xs font-semibold text-slate-700">
                              <RadioGroupItem value={rule.answer_option} />
                              {rule.answer_option}
                            </label>
                          ))}
                        </RadioGroup>
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
                          {fileErrors[q.id] && (
                            <p className="mt-2 text-xs font-semibold text-red-500 flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                              {fileErrors[q.id]}
                            </p>
                          )}
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
                  </Card>
                );
              })}
            </div>
          </main>

          {/* SIDEBAR KANAN (Tracker Pertanyaan) */}
          <aside className="hidden xl:block w-[340px] bg-slate-50 border-l border-slate-200 p-8 sticky top-0 h-[calc(100vh-88px)]">
            <Card className="flex h-full flex-col rounded-3xl border border-slate-100 p-6">
              <h4 className="font-bold text-sm text-slate-800 mb-6">Pertanyaan yang Terjawab</h4>
              <Progress value={totalQuestions ? (answeredCount / totalQuestions) * 100 : 0} className="mb-6" />
              
              <div className="grid grid-cols-5 gap-3 mb-8">
                {visibleQuestions.map((q, idx) => {
                  const isAnswered = isQuestionAnswered(q.id);
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
                <Button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm text-white hover:bg-blue-700"
                >
                  Submit Laporan
                </Button>
              </div>
            </Card>
          </aside>
        </>
      )}

      {/* ================= MODAL SUBMIT LAPORAN ================= */}
      {isSubmitModalOpen && (
        <Dialog open={isSubmitModalOpen} onOpenChange={(open) => !open && setIsSubmitModalOpen(false)}>
          <DialogContent className="max-w-sm rounded-3xl p-8 text-center">
            <DialogHeader>
              <DialogTitle className="mb-3 text-lg font-bold text-slate-900">Apakah kamu yakin ingin submit laporan?</DialogTitle>
              <DialogDescription className="mb-8 px-4 text-[11px] leading-relaxed"> 
              Anda masih dapat mengedit nya selagi status dalam keadaan pending dan belum di proses
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex items-center gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setIsSubmitModalOpen(false)} 
                disabled={isSubmitting}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm"
              >
                Batal
              </Button>
              <Button
                onClick={handleSubmitLaporan} 
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm text-white hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                    ? submitErrorMessage
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