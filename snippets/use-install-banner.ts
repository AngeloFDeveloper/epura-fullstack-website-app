"use client";

// Centralizes the "should the install banner be visible" decision so a fixed
// banner and a set of floating action buttons can stay in sync without
// either component guessing at the other's layout. Without this, the two
// components independently duplicated `isMobile`/`canInstall`/`dismissed`
// state and drifted out of sync — the banner would close but the floating
// buttons would stay lifted, or vice versa.

import { useEffect, useState } from "react";
import { usePwaInstall } from "./use-pwa-install";

const DISMISS_KEY = "install-banner-dismissed";

export function useInstallBanner() {
  const pwaInstall = usePwaInstall();
  const [isMobile, setIsMobile] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setIsMobile(window.matchMedia("(max-width: 640px)").matches);
      try {
        setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
      } catch {
        setDismissed(false);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage unavailable (private mode, etc.) — banner just won't persist across sessions.
    }
  }

  const isVisible = isMobile && pwaInstall.canInstall && !dismissed;

  return { ...pwaInstall, isVisible, dismiss };
}
