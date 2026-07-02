"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Supabase sets session from URL hash automatically
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
  }, []);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated! Please log in.");
      router.push("/auth/login");
    }
    setLoading(false);
  }

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", background: "#eaf5ea", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit, sans-serif" }}>
        <div style={{ background: "white", borderRadius: 20, padding: 36, maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <p style={{ fontSize: 48, margin: "0 0 12px" }}>⏳</p>
          <p style={{ color: "#6b7280", fontSize: 14 }}>Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#eaf5ea", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "Outfit, sans-serif" }}>
      <div style={{ background: "white", borderRadius: 20, padding: 36, maxWidth: 420, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 40, margin: "0 0 8px" }}>🔒</p>
          <h1 style={{ color: "#2d6a2d", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Set New Password</h1>
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Enter your new password below</p>
        </div>
        <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>New Password</label>
            <input type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              style={{ width: "100%", border: "1.5px solid #c8e6c9", borderRadius: 10, padding: "12px 16px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Confirm Password</label>
            <input type="password" required value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              style={{ width: "100%", border: "1.5px solid #c8e6c9", borderRadius: 10, padding: "12px 16px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ background: loading ? "#9ca3af" : "#2d6a2d", color: "white", border: "none", padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
