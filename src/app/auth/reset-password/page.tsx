"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) toast.error(error.message);
    else setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div style={{ minHeight: "100vh", background: "#eaf5ea", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "Outfit, sans-serif" }}>
        <div style={{ background: "white", borderRadius: 20, padding: 36, maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <p style={{ fontSize: 48, margin: "0 0 12px" }}>📧</p>
          <h1 style={{ color: "#2d6a2d", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Check Your Email</h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
            We sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
          </p>
          <Link href="/auth/login"
            style={{ color: "#2d6a2d", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#eaf5ea", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "Outfit, sans-serif" }}>
      <div style={{ background: "white", borderRadius: 20, padding: 36, maxWidth: 420, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 40, margin: "0 0 8px" }}>🔑</p>
          <h1 style={{ color: "#2d6a2d", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Reset Password</h1>
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
            Enter your email and we will send you a reset link
          </p>
        </div>
        <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{ width: "100%", border: "1.5px solid #c8e6c9", borderRadius: 10, padding: "12px 16px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
            />
          </div>
          <button type="submit" disabled={loading}
            style={{ background: loading ? "#9ca3af" : "#2d6a2d", color: "white", border: "none", padding: 14, borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6b7280" }}>
          Remember your password?{" "}
          <Link href="/auth/login" style={{ color: "#2d6a2d", fontWeight: 700, textDecoration: "none" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
