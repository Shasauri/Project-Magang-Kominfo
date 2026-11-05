"use client";

import { useEffect } from "react";
import { hints } from "driver.js/hints";
import "driver.js/dist/hints.css";

export type ReportHintKind = "note" | "needs-revision" | "revised";

const COPY: Record<ReportHintKind, { title: string; description: string }> = {
  note: {
    title: "Catatan dari Admin",
    description:
      "Admin sudah menambahkan catatan pada laporan ini. Buka detail laporan untuk membacanya dan memperbarui form.",
  },
  "needs-revision": {
    title: "Menunggu Revisi",
    description:
      "Laporan ini menunggu revisi dari Pelapor. Penanda berubah hijau setelah Pelapor menyimpan revisi dan mengonfirmasinya.",
  },
  revised: {
    title: "Revisi Dikonfirmasi",
    description:
      "Pelapor sudah mengonfirmasi revisi. Buka detail laporan untuk meninjau hasilnya.",
  },
};

export function ReportHints({
  items,
}: {
  items: { reportId: string; kind: ReportHintKind }[];
}) {
  useEffect(() => {
    const instance = hints({
      hints: items.map(({ reportId, kind }) => ({
        id: `report-${reportId}`,
        element: `[data-report-hint="${reportId}"]`,
        beacon: {
          className: `report-hint report-hint--${kind}`,
          side: "top",
          align: "center",
          offsetY: 4,
        },
        popover: {
          ...COPY[kind],
          side: "bottom",
          align: "start",
          popoverClass: "sifokam-tour",
        },
      })),
      buttonText: "Tutup",
      // Closing: popover tertutup, beacon tetap tampil.
      onButtonClick: (_element, _hint, { hints: driverHints }) => driverHints.close(),
    });

    instance.show();
    return () => instance.hide();
  }, [items]);

  return null;
}
