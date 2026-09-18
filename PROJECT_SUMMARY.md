# 📋 Rangkuman Project — SIFOKAM Frontend

**SIFOKAM** (Sistem Informasi Laporan Media Kominfo) adalah aplikasi web berbasis **Next.js** yang digunakan untuk pengelolaan dan pengajuan laporan evaluasi media oleh Pelapor kepada pihak Kominfo.

---

## 🛠️ Stack Teknologi

| Komponen | Teknologi |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Library UI** | React 19 |
| **Bahasa Pemrograman** | TypeScript |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Utilitas Tambahan** | `date-fns`, `react-day-picker` |
| **Containerization** | Docker & Docker Compose |
| **Backend Integration** | Laravel REST API (JWT / Bearer Token) |

---

## ✨ Fitur Utama Application

### 1. 🔐 Autentikasi & Keamanan
- **Login & Registrasi**: Dilengkapi dengan validasi **CAPTCHA** (base64 image & key hash).
- **Google OAuth**: Fitur login cepat menggunakan akun Google.
- **Lupa & Reset Kata Sandi**: Fitur pemulihan akun melalui token reset email.
- **Pengelolaan Token**: Penyimpanan JWT token pada cookie dengan dukungan opsi *Remember Me*.

### 2. 👤 Manajemen Profil (Pelapor & Admin)
- Edit informasi pribadi (Nama, Email).
- Ubah kata sandi dengan konfirmasi kata sandi lama.
- Unggah & hapus foto profil (Avatar) dengan fitur cache-busting `avatarVersion` dan penanganan inisial otomatis jika gambar gagal dimuat.

### 3. 📝 Pengajuan Laporan Media (Pelapor)
- **Form Multi-Tahap**:
  - **Tahap 1**: Pemilihan Jenis Media, Nama Media, dan Nomor Kontak.
  - **Tahap 2**: Kuesioner evaluasi interaktif berdasarkan jenis media.
- **Tipe Pertanyaan**: Opsi pilihan (radio button), input teks/URL, dan **Upload Lampiran PDF** (maksimal 5 MB).
- **Sidebar Tracker**: Indikator real-time jumlah pertanyaan yang sudah dijawab.
- **Logic Percabangan**: Pertanyaan turunan otomatis tersembunyi/dilewati jika pertanyaan sebelumnya dijawab negatif ("Tidak").

### 4. 📄 Daftar & Edit Laporan
- Riwayat laporan media yang telah diajukan.
- Detail laporan beserta status evaluasi.
- Fitur **Edit Laporan** untuk memperbarui jawaban atau mengganti lampiran PDF (dengan validasi maks 5MB).

### 5. 🛠️ Panel Administrasi (Admin)
- **Dashboard & Manajemen Laporan**: Melihat, merinjau, dan mengelola seluruh laporan media yang masuk.
- **Manajemen Pengguna**: Mengelola data akun pelapor dan hak akses.

---

## 📂 Struktur Direktori Utama

```text
frontend-magang/
├── src/
│   ├── app/
│   │   ├── admin/                # Halaman-halaman role Admin
│   │   │   ├── pengguna/
│   │   │   ├── profil/
│   │   │   └── reports/
│   │   ├── api/auth/google/      # Route handler callback Google OAuth
│   │   ├── login/                # Halaman Login
│   │   ├── register/             # Halaman Registrasi
│   │   ├── pelapor/              # Halaman-halaman role Pelapor
│   │   │   ├── profil/
│   │   │   ├── reports/
│   │   │   └── tambah-laporan/
│   │   ├── globals.css           # Styling global & Tailwind CSS v4 import
│   │   └── layout.tsx            # Root layout aplikasi
├── public/                       # Aset statis (logo, ikon, gambar dasar)
├── .env.example                  # Template variabel lingkungan
├── docker-compose.yml            # Konfigurasi Docker Compose
├── Dockerfile                    # Dockerfile penyiapan environment
├── next.config.ts                # Konfigurasi Next.js & remote image patterns
└── package.json                  # Dependensi dan script project
```

---

## ⚙️ Variabel Lingkungan (Environment Variables)

Aplikasi ini membutuhkan variabel lingkungan berikut di `.env.local` (saat dev) atau `.env` (saat prod):

```env
# URL API backend Laravel
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Base URL untuk akses media storage Laravel (avatar & lampiran)
NEXT_PUBLIC_STORAGE_URL=http://localhost:8000
```

---

## 🚀 Panduan Memulai Development

### Menjalankan secara Lokal
```bash
# 1. Install dependensi
npm install

# 2. Jalankan server pembangunan (development)
npm run dev
```
Buka `http://localhost:3000` di browser.

### Menjalankan dengan Docker
```bash
docker compose up -d --build
```

---

## 🚢 Panduan Deployment

Rincian persiapan deployment production (Nginx reverse proxy, multi-stage build Dockerfile, SSL, dan `.env` production) dapat dilihat di file `deployment_guide.md`.

