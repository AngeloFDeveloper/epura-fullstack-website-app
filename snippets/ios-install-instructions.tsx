"use client";

// Manual instructions modal for iOS, where there's no native install prompt —
// the user has to be walked through Safari's "Add to Home Screen" flow.

export function IOSInstallInstructions({ onClose }: { onClose: () => void }) {
  return (
    <div className="ios-install-overlay" onClick={onClose}>
      <div className="ios-install-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Install this app</h2>
        <p>
          In Safari, tap the Share button, then &quot;Add to Home Screen&quot;.
        </p>
        <button type="button" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
