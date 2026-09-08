"use client";

// Detects whether the current browser can install this site as a PWA and
// exposes a single `promptInstall()` call. Chrome/Edge fire
// `beforeinstallprompt` when the manifest + service worker criteria are met;
// iOS Safari never fires it, so `isIOS` is used as a fallback signal for a
// manual "Add to Home Screen" instructions flow instead.

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window));
    });

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const canInstall = !isStandalone && (!!deferredPrompt || isIOS);

  async function promptInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return { canInstall, isIOS, hasNativePrompt: !!deferredPrompt, promptInstall };
}
