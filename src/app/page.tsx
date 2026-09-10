"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  // Fungsi untuk smooth scrolling saat menu navbar diklik
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      // Offset untuk tinggi navbar yang sticky
      const y = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 selection:bg-blue-200">
      
      {/* ================= NAVBAR ================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3" onClick={(e) => scrollToSection(e, 'beranda')}>
            <div className="relative h-10 w-14 flex-shrink-0">
              <Image
                src="/images/Logo.png"
                alt="Logo Komdigi"
                fill
                className="object-contain object-left"
              />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-none tracking-tight">SIFOKAM</h1>
              <p className="text-[6px] text-slate-500 font-bold leading-tight uppercase">Sistem Form<br/>Kategori Media</p>
            </div>
          </Link>

          {/* Menu Tengah */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#beranda" onClick={(e) => scrollToSection(e, 'beranda')} className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors">Beranda</a>
            <a href="#tentang-kami" onClick={(e) => scrollToSection(e, 'tentang-kami')} className="text-[13px] font-semibold text-slate-600 hover:text-blue-600 transition-colors">Tentang Kami</a>
            <a href="#fitur" onClick={(e) => scrollToSection(e, 'fitur')} className="text-[13px] font-semibold text-slate-600 hover:text-blue-600 transition-colors">Fitur</a>
            <a href="#cara-kerja" onClick={(e) => scrollToSection(e, 'cara-kerja')} className="text-[13px] font-semibold text-slate-600 hover:text-blue-600 transition-colors">Cara Kerja</a>
          </div>

          {/* Tombol Kanan */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="py-2 px-6 rounded-full border-2 border-blue-100 text-blue-600 font-bold text-[13px] hover:bg-blue-50 transition-colors">
              Masuk
            </Link>
            <Link href="/register" className="py-2 px-6 rounded-full bg-blue-600 text-white font-bold text-[13px] hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
              Daftar
            </Link>
          </div>

        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section id="beranda" className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-slate-900">
        {/* Latar Belakang Gradien Radial */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-800/40 via-slate-900 to-slate-950"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-[11px] font-medium text-slate-200">Portal Resmi Diskominfo Kabupaten Banjar</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-white leading-[1.1] tracking-tight mb-6">
              Sistem Informasi Form Kategori Media
            </h1>
            
            <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-10 max-w-2xl">
              Portal akses resmi untuk pengelolaan data, verifikasi, dan pengajuan kategori media digital institusi secara cepat, akurat, dan transparan.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/register" className="py-3.5 px-8 rounded-full bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all">
                Mulai Sekarang
              </Link>
              <a href="#tentang-kami" onClick={(e) => scrollToSection(e, 'tentang-kami')} className="py-3.5 px-8 rounded-full bg-white/10 text-white border border-white/20 font-bold text-sm hover:bg-white/20 transition-all backdrop-blur-sm">
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FITUR SECTION ================= */}
      <section id="fitur" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-bold text-blue-600 tracking-widest uppercase block mb-3">Fitur Utama</span>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Efisiensi Pelaporan Media dalam Satu Platform</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Dirancang khusus untuk mendukung kelancaran administratif penyampaian laporan kegiatan publikasi institusi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Fitur 1 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Pelaporan Mudah</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">Laporan media yang dilengkapi dengan formulir terstruktur yang sistematis dan mudah diisi dalam beberapa menit saja.</p>
            </div>
            
            {/* Fitur 2 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Tracking Real-time</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">Pantau setiap tahap status pengajuan laporan Anda secara real-time dari mana saja dengan dashboard tracking terpusat.</p>
            </div>

            {/* Fitur 3 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Data Terorganisir</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">Semua data pelaporan tersimpan dengan rapi dan aman pada database terintegrasi yang mudah diakses kapan saja dibutuhkan.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TENTANG KAMI ================= */}
      <section id="tentang-kami" className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Kiri: Gambar Tentang Kami */}
            <div className="relative h-[400px] w-full overflow-hidden rounded-3xl bg-slate-100 lg:w-1/2">
              <Image
                src="/images/BG-image.png"
                alt="Ilustrasi layanan SIFOKAM"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/25"></div>
            </div>

            {/* Kanan: Teks */}
            <div className="w-full lg:w-1/2">
              <span className="text-[11px] font-bold text-blue-600 tracking-widest uppercase block mb-3">Tentang SIFOKAM</span>
              <h2 className="text-3xl font-bold text-slate-900 mb-6 leading-tight">Komitmen Pengelolaan Informasi Publik yang Transparan</h2>
              
              <div className="space-y-4 text-sm text-slate-500 leading-relaxed mb-8">
                <p>
                  SIFOKAM adalah sistem informasi inovatif yang dikembangkan oleh <strong>Dinas Komunikasi, Informatika, Statistik dan Persandian Pemerintah Kabupaten Banjar</strong>. Sistem ini dibuat untuk mempermudah institusi dalam mendaftarkan dan mengklasifikasikan kategori media penyebar digital yang kredibel.
                </p>
                <p>
                  Misi kami adalah mewujudkan transparansi data publikasi, memotong rantai birokrasi administratif yang lambat, serta memberikan jaminan efisiensi pelaporan harian di lapangan secara tepat waktu demi kemajuan daerah.
                </p>
              </div>

              <button className="py-2.5 px-6 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm">
                Visi & Misi
              </button>
            </div>
            
          </div>
        </div>
      </section>

      {/* ================= CARA KERJA ================= */}
      <section id="cara-kerja" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[11px] font-bold text-blue-600 tracking-widest uppercase block mb-3">Prosedur Penggunaan</span>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Tiga Langkah Mudah Pengajuan Form</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Proses pelaporan dirancang sesingkat mungkin untuk menghemat waktu Anda yang berharga.
            </p>
          </div>

          <div className="relative">
             {/* Garis Penghubung (Hanya desktop) */}
             <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-slate-200 z-0"></div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                {/* Langkah 1 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20 ring-8 ring-slate-50">
                    01
                  </div>
                  <h3 className="font-bold text-slate-900 mb-3">Daftar Akun</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[240px]">Registrasikan institusi atau diri Anda secara resmi di portal web untuk memperoleh hak akses.</p>
                </div>

                {/* Langkah 2 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20 ring-8 ring-slate-50">
                    02
                  </div>
                  <h3 className="font-bold text-slate-900 mb-3">Isi Form Pelaporan</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[240px]">Lengkapi berkas liputan serta pilih kategori media secara tepat sesuai format yang telah ditentukan.</p>
                </div>

                {/* Langkah 3 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20 ring-8 ring-slate-50">
                    03
                  </div>
                  <h3 className="font-bold text-slate-900 mb-3">Submit & Tracking</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[240px]">Kirim pengajuan dan pantau alur proses verifikasi admin secara online hingga status disetujui.</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ================= CALL TO ACTION (GERBANG LAYANAN) ================= */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold text-blue-600 tracking-widest uppercase block mb-3">Gerbang Layanan</span>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Akses Akun SIFOKAM Anda</h2>
            <p className="text-sm text-slate-500">Pilih jenis portal layanan yang sesuai dengan status keanggotaan Anda saat ini.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Login */}
            <div className="bg-slate-50 rounded-3xl p-10 border border-slate-200">
              <span className="inline-block px-3 py-1 rounded-md bg-blue-100 text-blue-700 text-[9px] font-black tracking-wider mb-6">ALREADY HAVE AN ACCOUNT</span>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Masuk Portal Pelapor</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Akses dashboard internal Anda untuk mengisi formulir laporan media baru, meninjau arsip digital, dan mengelola profil keamanan.
              </p>
              <Link href="/login" className="block w-full py-3.5 text-center rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                Masuk Sekarang
              </Link>
            </div>

            {/* Card Register */}
            <div className="bg-[#0f172a] rounded-3xl p-10 border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <span className="inline-block px-3 py-1 rounded-md bg-blue-900/50 text-blue-300 text-[9px] font-black tracking-wider mb-6">NEW REGISTRATION</span>
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Daftar Akun Baru</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 relative z-10">
                Belum terdaftar di SIFOKAM? Daftarkan instansi Anda untuk mulai membuat laporan media resmi daerah dalam hitungan detik.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 mb-8 relative z-10">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  Pendaftaran Terbuka Umum & Instansi
                </li>
              </ul>
              <Link href="/register" className="block w-full py-3.5 text-center rounded-xl bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors relative z-10">
                Daftar Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#0b1120] text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            {/* Kolom 1 */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative h-10 w-14 flex-shrink-0">
                  <Image
                    src="/images/Logo.png"
                    alt="Logo Komdigi"
                    fill
                    className="object-contain object-left"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white leading-none tracking-tight">SIFOKAM</h4>
                </div>
              </div>
              <p className="text-xs leading-relaxed max-w-xs">
                Sistem Informasi Form Kategori Media merupakan inovasi digital pengelolaan data dan pelaporan media di lingkungan Pemerintah Kabupaten Banjar.
              </p>
            </div>

            {/* Kolom 2 */}
            <div>
              <h4 className="text-white font-bold text-sm mb-5">Penyelenggara</h4>
              <ul className="space-y-3 text-xs">
                <li>Dinas Komunikasi, Informatika, Statistik dan Persandian</li>
                <li>Pemerintah Kabupaten Banjar, Kalimantan Selatan</li>
                <li>Email: Kominfomtpadmin@gmail.com</li>
              </ul>
            </div>

            {/* Kolom 3 */}
            <div>
              <h4 className="text-white font-bold text-sm mb-5">Navigasi Cepat</h4>
              <ul className="space-y-3 text-xs">
                <li><a href="#beranda" onClick={(e) => scrollToSection(e, 'beranda')} className="hover:text-blue-400 transition-colors">Beranda</a></li>
                <li><a href="#tentang-kami" onClick={(e) => scrollToSection(e, 'tentang-kami')} className="hover:text-blue-400 transition-colors">Tentang Kami</a></li>
                <li><a href="#fitur" onClick={(e) => scrollToSection(e, 'fitur')} className="hover:text-blue-400 transition-colors">Fitur</a></li>
                <li><a href="#cara-kerja" onClick={(e) => scrollToSection(e, 'cara-kerja')} className="hover:text-blue-400 transition-colors">Cara Kerja</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px]">
            <p>© 2026 SIFOKAM. All rights reserved.</p>
            <p>Dibuat untuk Transparansi Media Institusi.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}