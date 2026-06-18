"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Already dismissed
    if (localStorage.getItem("akpu-pwa-dismissed")) return;

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase())
      && !(window as any).MSStream;

    if (ios) {
      // Show iOS guide after 4 seconds
      const t = setTimeout(() => setIsIOS(true), 4000);
      const t2 = setTimeout(() => setShow(true), 4000);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }

    // Android Chrome — capture install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after 4 seconds
      setTimeout(() => setShow(true), 4000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem("akpu-pwa-dismissed", "1");
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setDeferredPrompt(null);
    }
  }

  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      width: "min(360px, calc(100vw - 32px))",
      background: "white",
      borderRadius: 20,
      boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
      padding: 20,
      zIndex: 9999,
      fontFamily: "Outfit, sans-serif",
      border: "1px solid #e5e7eb",
      animation: "slideUp 0.3s ease",
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Close */}
      <button onClick={dismiss}
        style={{ position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af" }}>
        ✕
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <img src="/icon-192.png" alt="Akpu Town"
          style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, border: "2px solid #eaf5ea" }} />
        <div>
          <p style={{ fontWeight: 800, fontSize: 16, color: "#111827", margin: "0 0 2px" }}>Akpu Town</p>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 2px" }}>Land of the Ancients</p>
          <p style={{ fontSize: 11, color: "#2d6a2d", fontWeight: 700, margin: 0 }}>akpu-town.ng</p>
        </div>
      </div>

      {/* Body */}
      <p style={{ fontSize: 13, color: "#374151", margin: "0 0 16px", lineHeight: 1.6 }}>
        {isIOS
          ? 'Install this app on your iPhone: tap the Share button (□↑) at the bottom of Safari, then tap "Add to Home Screen".'
          : "Install Akpu Town on your phone for quick access — works offline, no app store needed."}
      </p>

      {/* Buttons */}
      {isIOS ? (
        <div style={{ background: "#eaf5ea", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#2d6a2d", fontWeight: 700, margin: 0 }}>
            Tap <strong>Share ↑</strong> then <strong>"Add to Home Screen"</strong>
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={dismiss}
            style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Not now
          </button>
          <button onClick={handleInstall}
            style={{ flex: 2, background: "#2d6a2d", color: "white", border: "none", padding: "11px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            📲 Install App
          </button>
        </div>
      )}
    </div>
  );
}
