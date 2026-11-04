"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { DriveStep, Driver } from "driver.js";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TOUR_READY_SELECTOR,
  TOUR_STEPS,
  hasSeenTour,
  markTourSeen,
  type TourRole,
} from "@/lib/tour";
import "driver.js/dist/driver.css";

async function waitForSelector(selector: string, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (!document.querySelector(selector) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}

// Buang langkah yang targetnya tidak ada atau berada di luar layar
// (sidebar off-canvas di mobile, sidebar yang ditutup, right sidebar < xl).
function getVisibleSteps(steps: DriveStep[]) {
  return steps.filter((step) => {
    if (typeof step.element !== "string") return false;
    const el = document.querySelector(step.element);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.right > 0 &&
      rect.left < window.innerWidth
    );
  });
}

export function TourGuide({ role }: { role: TourRole }) {
  const pathname = usePathname();
  const isDashboard = pathname === `/${role}`;
  const driverRef = useRef<Driver | null>(null);
  const runIdRef = useRef(0);

  const runTour = useCallback(
    async (signal?: AbortSignal) => {
      if (driverRef.current) return;
      const runId = ++runIdRef.current;

      await waitForSelector(TOUR_READY_SELECTOR[role]);
      if (signal?.aborted || runId !== runIdRef.current || driverRef.current) {
        return;
      }

      const steps = getVisibleSteps(TOUR_STEPS[role]);
      if (steps.length === 0) return;

      const { driver } = await import("driver.js");
      if (signal?.aborted || runId !== runIdRef.current || driverRef.current) {
        return;
      }

      const instance = driver({
        steps,
        skipMissingElement: true,
        showProgress: true,
        progressText: "{{current}} dari {{total}}",
        nextBtnText: "Lanjut",
        prevBtnText: "Kembali",
        doneBtnText: "Selesai",
        allowClose: true,
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        overlayColor: "#0f172a",
        overlayOpacity: 0.55,
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: "sifokam-tour",
        onDestroyed: () => {
          driverRef.current = null;
        },
      });

      driverRef.current = instance;
      markTourSeen(role);
      instance.drive();
    },
    [role]
  );

  useEffect(() => {
    const controller = new AbortController();

    if (isDashboard) {
      if (!hasSeenTour(role)) void runTour(controller.signal);
    } else {
      driverRef.current?.destroy();
    }

    return () => {
      controller.abort();
      runIdRef.current += 1;
      driverRef.current?.destroy();
    };
  }, [isDashboard, role, runTour]);

  if (!isDashboard) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => void runTour()}
      aria-label="Mulai panduan penggunaan"
      title="Panduan"
      className="gap-2 rounded-xl text-slate-500 hover:text-blue-600"
    >
      <CircleHelp />
      <span className="hidden sm:inline">Panduan</span>
    </Button>
  );
}
