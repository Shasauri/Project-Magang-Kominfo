# 📰 SIFOKAM Frontend — Sistem Informasi Laporan Media Kominfo

SIFOKAM adalah aplikasi web berbasis **Next.js** yang dirancang untuk memfasilitasi pengajuan, pengelolaan, dan evaluasi laporan media oleh Pelapor serta verifikasi oleh Admin Kominfo Kabupaten Banjar.

---

## 🛠️ Stack Teknologi

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library Frontend**: React 19 & TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Utilitas**: `date-fns`, `react-day-picker`
- **Containerization**: Docker & Docker Compose
- **Backend Integration**: Laravel REST API (JWT Authentication)

---

## ✨ Fitur Utama

### 👤 Fitur Pelapor
- **Autentikasi & Keamanan**: Login & Registrasi dengan CAPTCHA, Google OAuth, serta Lupa/Reset Password.
- **Manajemen Profil**: Pengaturan data pribadi, ubah kata sandi, dan pengelolaan foto profil (avatar).
- **Pengajuan Laporan Media**:
  - Form multi-tahap berdasarkan Jenis Media.
  - Kuesioner evaluasi (pilihan ganda, teks, dan lampiran file PDF maks 5 MB).
  - Tracker status kelengkapan pertanyaan dijawab secara real-time.
- **Riwayat & Edit Laporan**: Melihat status laporan dan memperbarui jawaban/lampiran.

### 🛡️ Fitur Admin
- **Dashboard Laporan**: Peninjauan dan pengolahan seluruh laporan media yang masuk.
- **Manajemen Pengguna**: Pengelolaan data akun pelapor dan hak akses sistem.

---

## ⚙️ Persyaratan & Konfigurasi Environment

Buat file `.env.local` pada direktori root project dengan variabel berikut:

```env
# URL API Backend Laravel
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Base URL Storage Backend (Avatar & Lampiran PDF)
NEXT_PUBLIC_STORAGE_URL=http://localhost:8000
```

---

## 🚀 Panduan Memulai

### 1. Menjalankan secara Lokal (Development)

```bash
# Install dependensi
npm install

# Jalankan dev server
npm run dev
```
Akses aplikasi melalui browser di [http://localhost:3000](http://localhost:3000).

### 2. Menjalankan dengan Docker

```bash
# Build dan jalankan container
docker compose up -d --build
```

---

## 📚 Dokumentasi Terkait

- [`PROJECT_SUMMARY.md`](./PROJECT_SUMMARY.md) — Rangkuman arsitektur, struktur folder, dan detail fitur project.
- `deployment_guide.md` — Panduan lengkap penyiapan deployment ke server production (Nginx, SSL, Docker Multi-stage).
- `api_documentation.md` — Spesifikasi dan dokumentasi REST API Laravel.
