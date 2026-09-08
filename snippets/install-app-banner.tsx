"use client";

// Fixed bottom banner offering to install the PWA. The interesting bug this
// file fixes: `handleInstall` used to call `dismiss()` unconditionally after
// both branches — including the iOS branch, which only opens an instructions
// modal (iOS has no native install prompt). Since the modal lived inside this
// same component, dismissing the banner unmounted the modal in the same
// render pass, so the instructions never actually got seen. The fix is to
// only dismiss once the native prompt has actually fired.

import { useState } from "react";
import { useInstallBanner } from "./use-install-banner";
import { IOSInstallInstructions } from "./ios-install-instructions";

export function InstallAppBanner() {
  const { isVisible, isIOS, hasNativePrompt, promptInstall, dismiss } = useInstallBanner();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  function handleInstall() {
    if (hasNativePrompt) {
      promptInstall();
      dismiss();
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  }

  if (!isVisible) return null;

  return (
    <>
      <div className="install-banner">
        <p>Install the app for quick access.</p>
        <button type="button" onClick={handleInstall}>
          Install
        </button>
        <button type="button" onClick={dismiss} aria-label="Close">
          ✕
        </button>
      </div>

      {showIOSInstructions && (
        <IOSInstallInstructions onClose={() => setShowIOSInstructions(false)} />
      )}
    </>
  );
}
