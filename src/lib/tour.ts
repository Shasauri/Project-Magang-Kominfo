import type { DriveStep } from "driver.js";

export type TourRole = "admin" | "pelapor";

export const TOUR_KEYS: Record<TourRole, string> = {
  admin: "sifokam:tour:admin:v1",
  pelapor: "sifokam:tour:pelapor:v1",
};

// Elemen yang baru ada setelah data dashboard selesai dimuat.
export const TOUR_READY_SELECTOR: Record<TourRole, string> = {
  admin: '[data-tour="admin-reports-table"]',
  pelapor: '[data-tour="pelapor-total-card"]',
};

export const hasSeenTour = (role: TourRole) => {
  try {
    return window.localStorage.getItem(TOUR_KEYS[role]) === "1";
  } catch {
    return false;
  }
};

export const markTourSeen = (role: TourRole) => {
  try {
    window.localStorage.setItem(TOUR_KEYS[role], "1");
  } catch {
    // localStorage tidak tersedia: tour bisa berulang, tidak masalah.
  }
};

export const TOUR_STEPS: Record<TourRole, DriveStep[]> = {
  admin: [
    {
      element: '[data-tour="admin-sidebar"]',
      popover: {
        title: "Navigasi admin",
        description:
          "Gunakan menu di sini untuk membuka Dashboard, Daftar Pengguna, dan Profil. Tombol Keluar Akun ada di bagian bawah.",
        side: "right",
      },
    },
    {
      element: '[data-tour="admin-topbar"]',
      popover: {
        title: "Topbar",
        description:
          "Tombol ini menampilkan atau menyembunyikan sidebar. Judul di sebelahnya menunjukkan halaman yang sedang dibuka.",
        side: "bottom",
      },
    },
    {
      element: '[data-tour="admin-greeting"]',
      popover: {
        title: "Selamat datang",
        description:
          "Dashboard ini merangkum data pelapor dan seluruh laporan media yang masuk.",
        side: "bottom",
      },
    },
    {
      element: '[data-tour="admin-summary"]',
      popover: {
        title: "Ringkasan data",
        description:
          "Kartu Data Pelapor dan Data Laporan Media menampilkan jumlah data terkini.",
        side: "bottom",
      },
    },
    {
      element: '[data-tour="admin-reports-table"]',
      popover: {
        title: "Daftar laporan media",
        description:
          "Semua laporan tampil di tabel ini. Gunakan ikon mata untuk melihat detail, atau ikon dokumen untuk mencetak dan mengubah status.",
        side: "top",
      },
    },
    {
      element: '[data-tour="admin-recap-button"]',
      popover: {
        title: "Cetak rekap proposal",
        description:
          "Tombol ini mengunduh rekap laporan dalam format Excel. Anda bisa memfilternya berdasarkan kategori media.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: '[data-tour="admin-status-sidebar"]',
      popover: {
        title: "Kalender dan status",
        description:
          "Pilih tanggal di kalender dan pantau jumlah laporan yang sudah atau belum diverifikasi.",
        side: "left",
      },
    },
  ],
  pelapor: [
    {
      element: '[data-tour="pelapor-sidebar"]',
      popover: {
        title: "Navigasi pelapor",
        description:
          "Menu Dashboard dan Profil ada di sini. Gunakan Keluar Akun untuk mengakhiri sesi.",
        side: "right",
      },
    },
    {
      element: '[data-tour="pelapor-topbar"]',
      popover: {
        title: "Topbar",
        description:
          "Tombol di kiri membuka atau menutup menu. Nama dan inisial akun Anda tampil di kanan.",
        side: "bottom",
      },
    },
    {
      element: '[data-tour="pelapor-greeting"]',
      popover: {
        title: "Selamat datang",
        description:
          "Dashboard ini merangkum seluruh proposal media yang Anda kirim.",
        side: "bottom",
      },
    },
    {
      element: '[data-tour="pelapor-total-card"]',
      popover: {
        title: "Total laporan",
        description:
          "Kartu ini menunjukkan jumlah seluruh laporan media yang pernah Anda buat.",
        side: "bottom",
      },
    },
    {
      element: '[data-tour="pelapor-status-cards"]',
      popover: {
        title: "Status verifikasi",
        description:
          "Pantau berapa laporan yang sudah diverifikasi dan yang masih menunggu verifikasi.",
        side: "bottom",
      },
    },
    {
      element: '[data-tour="pelapor-reports-table"]',
      popover: {
        title: "Daftar laporan media",
        description:
          "Lihat status tiap laporan di sini. Tanda merah pada nama media berarti ada catatan dari admin. Klik ikon mata untuk membuka detail.",
        side: "top",
      },
    },
    {
      element: '[data-tour="pelapor-add-button"]',
      popover: {
        title: "Tambah proposal",
        description:
          "Klik tombol ini untuk membuat proposal media baru. Anda akan memilih jenis media, nama media, dan nomor kontak.",
        side: "bottom",
        align: "end",
      },
    },
  ],
};
