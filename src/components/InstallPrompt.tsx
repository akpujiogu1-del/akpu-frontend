"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem("akpu-install-dismissed")) return;

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      // Show iOS manual instruction after 3 seconds
      setTimeout(() => setShow(true), 3000);
      return;
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: any) => {
      e.preventDefault();
      setPrompt(e);
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("akpu-install-dismissed", "1");
  }

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setShow(false);
  }

  if (!show || dismissed) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      left: "50%",
      transform: "translateX(-50%)",
      width: "min(360px, calc(100vw - 32px))",
      background: "white",
      borderRadius: 20,
      boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
      padding: 20,
      zIndex: 9999,
      fontFamily: "Outfit, sans-serif",
      border: "1px solid #e5e7eb",
    }}>
      {/* Close button */}
      <button
        onClick={dismiss}
        style={{
          position: "absolute", top: 12, right: 14,
          background: "none", border: "none",
          fontSize: 20, cursor: "pointer", color: "#9ca3af",
        }}>
        ✕
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <img
          src="/icon-192.png"
          style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, border: "2px solid #eaf5ea" }}
          alt="Akpu Town"
        />
        <div>
          <p style={{ fontWeight: 800, fontSize: 15, color: "#111827", margin: "0 0 2px" }}>
            Akpu Town
          </p>
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
            Land of the Ancients
          </p>
          <p style={{ fontSize: 11, color: "#2d6a2d", fontWeight: 600, margin: "3px 0 0" }}>
            akpu-town.ng
          </p>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "#374151", margin: "0 0 16px", lineHeight: 1.5 }}>
        {isIOS
          ? 'Install this app on your phone: tap the Share button below, then select "Add to Home Screen".'
          : "Add Akpu Town to your home screen for quick access — works like a native app, no app store needed."}
      </p>

      {isIOS ? (
        <div style={{ background: "#eaf5ea", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#2d6a2d", fontWeight: 600, textAlign: "center" }}>
          Tap <strong>Share</strong> (□↑) → <strong>Add to Home Screen</strong>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={dismiss}
            style={{ flex: 1, background: "#f3f4f6", color: "#374151", border: "none", padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Not now
          </button>
          <button
            onClick={install}
            style={{ flex: 2, background: "#2d6a2d", color: "white", border: "none", padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            📲 Install App
          </button>
        </div>
      )}
    </div>
  );
}
